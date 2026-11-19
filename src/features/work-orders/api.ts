import { supabase } from '@/lib/supabase';
import type { Enums, Tables } from '@/types/database';

export type OrderStatus = Enums<'order_status'>;
export type OrderPriority = Enums<'order_priority'>;
export type Customer = Pick<
  Tables<'customers'>,
  'id' | 'name' | 'address' | 'phone' | 'email' | 'latitude' | 'longitude'
>;
export type WorkOrder = Tables<'work_orders'> & { customer: Customer | null };
export type WorkOrderPhoto = Tables<'work_order_photos'> & { url: string | null };

const ORDER_SELECT = '*, customer:customers(id, name, address, phone, email, latitude, longitude)';
const SIGNED_URL_TTL = 60 * 60; // 1 hour — buckets are private, files are only reachable via signed URLs

const PRIORITY_RANK: Record<OrderPriority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
const STATUS_RANK: Record<OrderStatus, number> = { in_progress: 0, pending: 1, completed: 2, cancelled: 3 };

/**
 * Orders assigned to the signed-in user. RLS already restricts technicians to their own
 * orders; the explicit filter also keeps "My work orders" correct when an admin logs in.
 * Sorted for a technician's day: active jobs first, then by schedule, then by urgency.
 */
export async function fetchMyWorkOrders(userId: string): Promise<WorkOrder[]> {
  const { data, error } = await supabase
    .from('work_orders')
    .select(ORDER_SELECT)
    .eq('assigned_to', userId)
    .order('scheduled_for', { ascending: true, nullsFirst: false });
  if (error) throw error;

  return [...data].sort((a, b) => {
    const s = STATUS_RANK[a.status] - STATUS_RANK[b.status];
    if (s !== 0) return s;
    const ta = a.scheduled_for ? Date.parse(a.scheduled_for) : Infinity;
    const tb = b.scheduled_for ? Date.parse(b.scheduled_for) : Infinity;
    // History reads newest-first; active work reads soonest-first.
    const t = a.status === 'completed' || a.status === 'cancelled' ? tb - ta : ta - tb;
    return t !== 0 ? t : PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
  });
}

export async function fetchWorkOrder(id: string): Promise<WorkOrder> {
  const { data, error } = await supabase.from('work_orders').select(ORDER_SELECT).eq('id', id).single();
  if (error) throw error;
  return data;
}

/** Status transitions. `started_at` / `completed_at` are stamped by a DB trigger (server clock). */
export async function startWorkOrder(id: string): Promise<WorkOrder> {
  const { data, error } = await supabase
    .from('work_orders')
    .update({ status: 'in_progress' })
    .eq('id', id)
    .select(ORDER_SELECT)
    .single();
  if (error) throw error;
  return data;
}

export async function completeWorkOrder(
  id: string,
  input: { signatureSvg: string; notes: string },
): Promise<WorkOrder> {
  const path = `${id}/${uniqueName('svg')}`;
  const { error: uploadError } = await supabase.storage
    .from('signatures')
    .upload(path, input.signatureSvg, { contentType: 'image/svg+xml' });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from('work_orders')
    .update({
      status: 'completed',
      signature_path: path,
      technician_notes: input.notes.trim() || null,
    })
    .eq('id', id)
    .select(ORDER_SELECT)
    .single();
  if (error) throw error;
  return data;
}

export async function fetchPhotos(orderId: string): Promise<WorkOrderPhoto[]> {
  const { data, error } = await supabase
    .from('work_order_photos')
    .select('*')
    .eq('work_order_id', orderId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  if (!data.length) return [];

  const { data: signed, error: signError } = await supabase.storage
    .from('work-order-photos')
    .createSignedUrls(
      data.map((p) => p.storage_path),
      SIGNED_URL_TTL,
    );
  if (signError) throw signError;

  const urlByPath = new Map(signed.map((s) => [s.path, s.signedUrl]));
  return data.map((p) => ({ ...p, url: urlByPath.get(p.storage_path) ?? null }));
}

/** Uploads a local image (camera/library URI) and registers it on the work order. */
export async function uploadPhoto(
  orderId: string,
  asset: { uri: string; mimeType?: string | null },
): Promise<void> {
  const contentType = asset.mimeType ?? 'image/jpeg';
  const ext = contentType.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg';
  const path = `${orderId}/${uniqueName(ext)}`;

  // fetch() on a file:// / blob: URI gives us the bytes on native and web alike.
  const body = await (await fetch(asset.uri)).arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from('work-order-photos')
    .upload(path, body, { contentType });
  if (uploadError) throw uploadError;

  const { error } = await supabase.from('work_order_photos').insert({ work_order_id: orderId, storage_path: path });
  if (error) throw error;
}

export async function getSignedUrl(bucket: 'signatures' | 'work-order-photos' | 'documents', path: string) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, SIGNED_URL_TTL);
  if (error) throw error;
  return data.signedUrl;
}

function uniqueName(ext: string) {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
}

// ---------------------------------------------------------------- AI document scanning
export type ScannedDocument = Tables<'scanned_documents'>;
export type LineItem = { description?: string; quantity?: number | null; unit_price?: number | null; amount?: number | null };

export async function fetchDocuments(orderId: string): Promise<ScannedDocument[]> {
  const { data, error } = await supabase
    .from('scanned_documents')
    .select('*')
    .eq('work_order_id', orderId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchDocument(id: string): Promise<ScannedDocument> {
  const { data, error } = await supabase.from('scanned_documents').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

/**
 * Scan flow: upload the photo to the private `documents` bucket, register it as
 * `processing`, then ask the `extract-document` Edge Function to read it.
 * Returns the document id; the extracted row is read back with `fetchDocument`.
 */
export async function scanDocument(
  orderId: string,
  asset: { uri: string; mimeType?: string | null },
  onStep?: (step: 'uploading' | 'reading') => void,
): Promise<string> {
  onStep?.('uploading');
  const contentType = asset.mimeType ?? 'image/jpeg';
  const ext = contentType.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg';
  const path = `${orderId}/${uniqueName(ext)}`;
  const body = await (await fetch(asset.uri)).arrayBuffer();

  const { error: uploadError } = await supabase.storage.from('documents').upload(path, body, { contentType });
  if (uploadError) throw uploadError;

  const { data: doc, error } = await supabase
    .from('scanned_documents')
    .insert({ work_order_id: orderId, storage_path: path })
    .select('id')
    .single();
  if (error) throw error;

  onStep?.('reading');
  const { error: fnError } = await supabase.functions.invoke('extract-document', { body: { document_id: doc.id } });
  // A failed extraction is still a saved document (status `failed`) — the caller shows it.
  if (fnError) console.warn('[scan] extraction failed', fnError.message);
  return doc.id;
}
