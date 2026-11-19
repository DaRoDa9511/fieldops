/**
 * Demo-mode extraction: realistic invoice data without calling an AI model.
 * Used when no ANTHROPIC_API_KEY secret is configured (public portfolio demo:
 * zero cost, nothing to abuse). Deterministic per document id so a re-run of the
 * same document always "reads" the same invoice.
 */
import type { Extraction } from './schema.ts'

type Template = { vendor: string; prefix: string; items: [string, number, number][] }

const TEMPLATES: Template[] = [
  {
    vendor: 'Ferguson HVAC Supply',
    prefix: 'FHS',
    items: [
      ['Run capacitor 45/5 MFD 440V', 2, 18.5],
      ['Condenser fan motor 1/4 HP', 1, 142.0],
      ['R-410A refrigerant (lb)', 3, 24.75],
    ],
  },
  {
    vendor: 'Graybar Electric',
    prefix: 'GB',
    items: [
      ['20A single-pole breaker', 2, 12.9],
      ['12 AWG THHN wire (100 ft)', 1, 64.0],
      ['Wire nuts assorted (box)', 1, 8.45],
    ],
  },
  {
    vendor: 'Home Depot Pro',
    prefix: 'HDP',
    items: [
      ['2x4 LED troffer 40W', 6, 49.97],
      ['Mounting clips (pack of 4)', 3, 6.98],
    ],
  },
  {
    vendor: 'Plumbing Distributors of Texas',
    prefix: 'PDT',
    items: [
      ['T&P relief valve 3/4"', 1, 27.4],
      ['Water heater drain valve brass', 1, 15.2],
      ['PTFE thread tape', 2, 2.35],
      ['Flex water connector 18"', 2, 11.6],
    ],
  },
  {
    vendor: 'Grainger Industrial Supply',
    prefix: 'GR',
    items: [
      ['Deep groove ball bearing 6205-2RS', 2, 21.3],
      ['V-belt A42', 1, 17.85],
      ['Multipurpose grease cartridge', 1, 9.6],
    ],
  },
]

function hash(s: string) {
  let h = 2166136261
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return h >>> 0
}

const round = (n: number) => Math.round(n * 100) / 100

export function demoExtraction(documentId: string): Extraction {
  const h = hash(documentId)
  const tpl = TEMPLATES[h % TEMPLATES.length]
  const date = new Date(Date.now() - (h % 3) * 86_400_000)

  const line_items = tpl.items.map(([description, quantity, unit_price]) => ({
    description,
    quantity,
    unit_price,
    amount: round(quantity * unit_price),
  }))
  const subtotal = round(line_items.reduce((s, i) => s + i.amount, 0))
  const tax = round(subtotal * 0.0825) // Austin, TX sales tax
  return {
    vendor_name: tpl.vendor,
    invoice_number: `${tpl.prefix}-${String(100000 + (h % 900000))}`,
    invoice_date: date.toISOString().slice(0, 10),
    currency: 'USD',
    line_items,
    subtotal,
    tax,
    total_amount: round(subtotal + tax),
    confidence: 0.9 + (h % 9) / 100,
  }
}
