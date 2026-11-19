/**
 * extract-document — AI extraction of invoices / delivery notes.
 *
 * POST { document_id } (caller's Supabase JWT required)
 *  1. Verifies the caller may access the document (assigned technician or admin).
 *  2. LIVE mode (ANTHROPIC_API_KEY secret set): downloads the image from the private
 *     `documents` bucket and asks Claude for a strict, schema-validated JSON extraction.
 *     DEMO mode (no key): returns realistic simulated data after a short delay.
 *  3. Writes the result to `scanned_documents` (processing → extracted | failed).
 *     Supabase Realtime pushes that change to the admin dashboard instantly.
 *
 * Enable live AI:  supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
 * Optional model:  supabase secrets set ANTHROPIC_MODEL=claude-opus-5-5
 */
import Anthropic from 'npm:@anthropic-ai/sdk@1.10.0'
import { zodOutputFormat } from 'npm:@anthropic-ai/sdk@1.10.0/helpers/zod'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { encodeBase64 } from 'jsr:@std/encoding@1/base64'

import { demoExtraction } from './demo.ts'
import { ExtractionSchema, type Extraction } from './schema.ts'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
const MODEL = Deno.env.get('ANTHROPIC_MODEL') ?? 'claude-opus-5-5'
const DEMO_DELAY_MS = 2500

const PROMPT = `You are reading a photo of a supplier invoice, receipt or delivery note taken by a field technician.
Extract the data exactly as printed. Use null for anything that is not visible or not legible — never guess.
- invoice_date: format YYYY-MM-DD.
- currency: ISO 4217 code inferred from symbols or text (default USD only if a "$" is shown and nothing else indicates otherwise).
- line_items: one entry per product/service line; amount = line total as printed.
- Numbers: plain decimals without currency symbols or thousands separators.
- confidence: 0-1 reflecting legibility and completeness of the document.`

const MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const
type MediaType = (typeof MEDIA_TYPES)[number]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

  // --- Who is calling? -------------------------------------------------------------
  const jwt = req.headers.get('Authorization')?.replace('Bearer ', '')
  const { data: auth } = await admin.auth.getUser(jwt ?? '')
  if (!auth.user) return json({ error: 'Unauthorized' }, 401)

  let documentId: string | undefined
  try {
    documentId = (await req.json())?.document_id
  } catch {
    /* fall through */
  }
  if (!documentId) return json({ error: 'document_id is required' }, 400)

  // --- May this user touch this document? (same rule as the RLS policies) -----------
  const { data: doc } = await admin
    .from('scanned_documents')
    .select('id, storage_path, status, work_order_id, work_orders(assigned_to)')
    .eq('id', documentId)
    .single()
  if (!doc) return json({ error: 'Document not found' }, 404)

  const { data: profile } = await admin.from('profiles').select('role').eq('id', auth.user.id).single()
  const order = doc.work_orders as unknown as { assigned_to: string | null } | null
  const allowed = profile?.role === 'admin' || order?.assigned_to === auth.user.id
  if (!allowed) return json({ error: 'Forbidden' }, 403)

  if (doc.status !== 'processing') return json({ status: doc.status, skipped: true })

  // --- Extract ---------------------------------------------------------------------
  const mode = ANTHROPIC_API_KEY ? 'live' : 'demo'
  try {
    let result: Extraction
    let raw: Record<string, unknown>

    if (!ANTHROPIC_API_KEY) {
      await new Promise((r) => setTimeout(r, DEMO_DELAY_MS))
      result = demoExtraction(doc.id)
      raw = { mode, note: 'Simulated extraction — set the ANTHROPIC_API_KEY secret to enable live AI.' }
    } else {
      const { data: file, error: dlError } = await admin.storage.from('documents').download(doc.storage_path)
      if (dlError || !file) throw new Error(`Could not read image: ${dlError?.message}`)
      const mediaType = (MEDIA_TYPES as readonly string[]).includes(file.type) ? (file.type as MediaType) : 'image/jpeg'
      const data = encodeBase64(new Uint8Array(await file.arrayBuffer()))

      const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY })
      const response = await client.messages.parse({
        model: MODEL,
        max_tokens: 16000,
        output_config: { effort: 'low', format: zodOutputFormat(ExtractionSchema) },
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: mediaType, data } },
              { type: 'text', text: PROMPT },
            ],
          },
        ],
      })
      if (response.stop_reason === 'refusal') throw new Error('The model declined to process this image.')
      if (!response.parsed_output) throw new Error(`No structured output (stop_reason: ${response.stop_reason})`)
      result = response.parsed_output
      raw = { mode, model: response.model, usage: response.usage, result }
    }

    const validDate = result.invoice_date && /^\d{4}-\d{2}-\d{2}$/.test(result.invoice_date) ? result.invoice_date : null
    const { error: upError } = await admin
      .from('scanned_documents')
      .update({
        status: 'extracted',
        vendor_name: result.vendor_name,
        invoice_number: result.invoice_number,
        invoice_date: validDate,
        currency: (result.currency ?? 'USD').toUpperCase().slice(0, 3),
        line_items: result.line_items,
        subtotal: result.subtotal,
        tax: result.tax,
        total_amount: result.total_amount,
        confidence: Math.min(1, Math.max(0, result.confidence)),
        ai_raw: raw,
      })
      .eq('id', doc.id)
    if (upError) throw new Error(upError.message)

    return json({ status: 'extracted', mode, document_id: doc.id })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    console.error('[extract-document]', doc.id, message)
    await admin.from('scanned_documents').update({ status: 'failed', ai_raw: { mode, error: message } }).eq('id', doc.id)
    return json({ status: 'failed', mode, error: message }, 500)
  }
})
