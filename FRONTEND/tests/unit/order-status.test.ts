import { describe, it, expect } from 'vitest';
import { 
  ORDER_STATUS_FLOW, 
  ORDER_STATUS_MAP, 
  getNextOrderStatus 
} from '@/lib/shared/constants/order-status';

describe('Order Status Flow and Pipeline', () => {
  it('should define the standard 6-step workshop lifecycle in order', () => {
    const keys = ORDER_STATUS_FLOW.map(s => s.key);
    expect(keys).toEqual([
      'received',
      'cutting',
      'stitching',
      'finishing',
      'ready',
      'delivered',
      'cancelled'
    ]);
  });

  it('should correctly determine the next status in the pipeline', () => {
    expect(getNextOrderStatus('received')).toBe('cutting');
    expect(getNextOrderStatus('cutting')).toBe('stitching');
    expect(getNextOrderStatus('stitching')).toBe('finishing');
    expect(getNextOrderStatus('finishing')).toBe('ready');
    expect(getNextOrderStatus('ready')).toBe('delivered');
    expect(getNextOrderStatus('delivered')).toBeNull();
    expect(getNextOrderStatus('cancelled')).toBeNull();
  });

  it('should return human-readable labels and descriptions for tailors', () => {
    expect(ORDER_STATUS_MAP.received.labelEn).toBe('Received');
    expect(ORDER_STATUS_MAP.cutting.labelEn).toBe('Cutting');
    expect(ORDER_STATUS_MAP.stitching.labelEn).toBe('Stitching');
    expect(ORDER_STATUS_MAP.ready.labelEn).toBe('Ready for Pickup');
    expect(ORDER_STATUS_MAP.delivered.labelEn).toBe('Delivered');
    expect(ORDER_STATUS_MAP.received.label).toBe('Received');
  });

  it('should provide dotClass and badgeClass for UI styling', () => {
    expect(ORDER_STATUS_MAP.cutting.dotClass).toBe('bg-amber-500');
    expect(ORDER_STATUS_MAP.ready.badgeClass).toContain('bg-emerald-50');
  });
});
