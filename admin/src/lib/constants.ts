import type { Enums } from '@/types/database'

export type OrderStatus = Enums<'order_status'>
export type OrderPriority = Enums<'order_priority'>
export type DocumentStatus = Enums<'document_status'>

export const STATUSES: OrderStatus[] = ['pending', 'in_progress', 'completed', 'cancelled']
export const PRIORITIES: OrderPriority[] = ['urgent', 'high', 'medium', 'low']

/** Shared with the mobile app's theme so both products feel like one system. */
export const STATUS_META: Record<OrderStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: '#F79009' },
  in_progress: { label: 'In progress', color: '#2F6BFF' },
  completed: { label: 'Completed', color: '#12B76A' },
  cancelled: { label: 'Cancelled', color: '#98A2B3' },
}

export const PRIORITY_META: Record<OrderPriority, { label: string; color: string }> = {
  urgent: { label: 'Urgent', color: '#F04438' },
  high: { label: 'High', color: '#F79009' },
  medium: { label: 'Medium', color: '#2F6BFF' },
  low: { label: 'Low', color: '#98A2B3' },
}

export const DOCUMENT_STATUS_META: Record<DocumentStatus, { label: string; color: string }> = {
  processing: { label: 'Processing', color: '#2F6BFF' },
  extracted: { label: 'Extracted', color: '#7A5AF8' },
  verified: { label: 'Verified', color: '#12B76A' },
  failed: { label: 'Failed', color: '#F04438' },
}
