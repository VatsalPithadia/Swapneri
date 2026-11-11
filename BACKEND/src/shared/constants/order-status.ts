// ==============================================================================
// lib/shared/constants/order-status.ts
// Order status definitions, badges, and state flow transitions
// Clean English workshop statuses
// ==============================================================================

import { OrderStatus } from '../types/database';

export interface OrderStatusConfig {
  key: OrderStatus;
  label: string;
  labelEn: string;
  description: string;
  badgeClass: string;
  dotClass: string;
  nextStatus?: OrderStatus;
}

export const ORDER_STATUS_FLOW: OrderStatusConfig[] = [
  {
    key: 'received',
    label: 'Received',
    labelEn: 'Received',
    description: 'Fabric & measurements received, ready for cutting',
    badgeClass: 'bg-stone-100 text-stone-800 border-stone-200',
    dotClass: 'bg-stone-500',
    nextStatus: 'cutting',
  },
  {
    key: 'cutting',
    label: 'Cutting',
    labelEn: 'Cutting',
    description: 'Master tailor is drafting pattern and cutting fabric',
    badgeClass: 'bg-amber-50 text-amber-900 border-amber-200',
    dotClass: 'bg-amber-500',
    nextStatus: 'stitching',
  },
  {
    key: 'stitching',
    label: 'Stitching',
    labelEn: 'Stitching',
    description: 'Karigar is assembling and sewing the garment',
    badgeClass: 'bg-blue-50 text-blue-900 border-blue-200',
    dotClass: 'bg-blue-500',
    nextStatus: 'finishing',
  },
  {
    key: 'finishing',
    label: 'Finishing',
    labelEn: 'Finishing',
    description: 'Hemming, hooks, buttons, pressing & quality check',
    badgeClass: 'bg-purple-50 text-purple-900 border-purple-200',
    dotClass: 'bg-purple-500',
    nextStatus: 'ready',
  },
  {
    key: 'ready',
    label: 'Ready for Pickup',
    labelEn: 'Ready for Pickup',
    description: 'Garment complete, packed and ready for customer trial or pickup',
    badgeClass: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    dotClass: 'bg-emerald-600',
    nextStatus: 'delivered',
  },
  {
    key: 'delivered',
    label: 'Delivered',
    labelEn: 'Delivered',
    description: 'Customer received the garment and settled payments',
    badgeClass: 'bg-teal-50 text-teal-900 border-teal-200',
    dotClass: 'bg-teal-600',
  },
  {
    key: 'cancelled',
    label: 'Cancelled',
    labelEn: 'Cancelled',
    description: 'Order was cancelled or refunded',
    badgeClass: 'bg-zinc-100 text-zinc-600 border-zinc-200',
    dotClass: 'bg-zinc-400',
  },
];

export const ORDER_STATUS_MAP: Record<OrderStatus, OrderStatusConfig> = ORDER_STATUS_FLOW.reduce(
  (acc, item) => ({ ...acc, [item.key]: item }),
  {} as Record<OrderStatus, OrderStatusConfig>
);

export function getNextOrderStatus(current: OrderStatus): OrderStatus | null {
  return ORDER_STATUS_MAP[current]?.nextStatus || null;
}
