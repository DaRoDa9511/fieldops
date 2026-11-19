import { supabase } from '@/lib/supabase'
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database'

export type Profile = Tables<'profiles'>
export type Customer = Tables<'customers'>
export type ScannedDocument = Tables<'scanned_documents'>
export type WorkOrder = Tables<'work_orders'> & {
  customer: Pick<Customer, 'id' | 'name' | 'address' | 'phone'> | null
  assignee: Pick<Profile, 'id' | 'full_name'> | null
}
export type WorkOrderPhoto = Tables<'work_order_photos'> & { url: string | null }
export type LineItem = { description?: string; quantity?: number; unit_price?: number; amount?: number }

const SIGNED_URL_TTL = 60 * 60

// work_orders has two FKs to profiles (assigned_to, created_by) → name the one to embed.
const ORDER_SELECT =
  '*, customer:customers(id, name, address, phone), assignee:profiles!work_orders_assigned_to_fkey(id, full_name)'

function unwrap<T>({ data, error }: { data: T | null; error: { message: string } | null }): T {
  if (error) throw new Error(error.message)
  return data as T
}

// ---------------------------------------------------------------- work orders
export async function fetchWorkOrders(): Promise<WorkOrder[]> {
  return unwrap(
    await supabase.from('work_orders').select(ORDER_SELECT).order('scheduled_for', { ascending: false, nullsFirst: true }),
  )
}

export async function fetchWorkOrder(id: string): Promise<WorkOrder> {
  return unwrap(await supabase.from('work_orders').select(ORDER_SELECT).eq('id', id).single())
}

export async function createWorkOrder(input: TablesInsert<'work_orders'>): Promise<WorkOrder> {
  return unwrap(await supabase.from('work_orders').insert(input).select(ORDER_SELECT).single())
}

export async function updateWorkOrder(id: string, patch: TablesUpdate<'work_orders'>): Promise<WorkOrder> {
  return unwrap(await supabase.from('work_orders').update(patch).eq('id', id).select(ORDER_SELECT).single())
}

// ---------------------------------------------------------------- media
export async function fetchPhotos(orderId: string): Promise<WorkOrderPhoto[]> {
  const rows = unwrap(
    await supabase.from('work_order_photos').select('*').eq('work_order_id', orderId).order('created_at'),
  )
  if (!rows.length) return []
  const signed = unwrap(
    await supabase.storage.from('work-order-photos').createSignedUrls(
      rows.map((r) => r.storage_path),
      SIGNED_URL_TTL,
    ),
  )
  const byPath = new Map(signed.map((s) => [s.path, s.signedUrl]))
  return rows.map((r) => ({ ...r, url: byPath.get(r.storage_path) ?? null }))
}

export async function signedUrl(bucket: 'signatures' | 'documents' | 'work-order-photos', path: string) {
  return unwrap(await supabase.storage.from(bucket).createSignedUrl(path, SIGNED_URL_TTL)).signedUrl
}

export async function fetchDocuments(orderId?: string): Promise<ScannedDocument[]> {
  let q = supabase.from('scanned_documents').select('*').order('created_at', { ascending: false })
  if (orderId) q = q.eq('work_order_id', orderId)
  return unwrap(await q)
}

export async function updateDocument(id: string, patch: TablesUpdate<'scanned_documents'>) {
  return unwrap(await supabase.from('scanned_documents').update(patch).eq('id', id).select('*').single())
}

// ---------------------------------------------------------------- people
export async function fetchCustomers(): Promise<Customer[]> {
  return unwrap(await supabase.from('customers').select('*').order('name'))
}

export async function saveCustomer(input: TablesInsert<'customers'>, id?: string): Promise<Customer> {
  return id
    ? unwrap(await supabase.from('customers').update(input).eq('id', id).select('*').single())
    : unwrap(await supabase.from('customers').insert(input).select('*').single())
}

export async function deleteCustomer(id: string) {
  const { error } = await supabase.from('customers').delete().eq('id', id)
  if (error) {
    throw new Error(
      error.code === '23503' ? 'customers.hasOrders' : error.message,
    )
  }
}

export async function fetchTechnicians(): Promise<Profile[]> {
  return unwrap(await supabase.from('profiles').select('*').eq('role', 'technician').order('full_name'))
}
