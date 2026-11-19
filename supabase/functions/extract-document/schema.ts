import { z } from 'npm:zod@3.25.76'

/** Strict output contract for invoice / delivery-note extraction. */
export const ExtractionSchema = z.object({
  vendor_name: z.string().nullable().describe('Supplier / issuer company name'),
  invoice_number: z.string().nullable().describe('Invoice, receipt or delivery note number'),
  invoice_date: z.string().nullable().describe('Issue date as YYYY-MM-DD'),
  currency: z.string().nullable().describe('ISO 4217 code, e.g. USD, EUR, BOB'),
  line_items: z.array(
    z.object({
      description: z.string(),
      quantity: z.number().nullable(),
      unit_price: z.number().nullable(),
      amount: z.number().nullable(),
    }),
  ),
  subtotal: z.number().nullable(),
  tax: z.number().nullable(),
  total_amount: z.number().nullable(),
  confidence: z.number().describe('0 to 1: how legible and complete the document was'),
})

export type Extraction = z.infer<typeof ExtractionSchema>
