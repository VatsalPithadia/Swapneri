import { describe, it, expect, beforeEach } from 'vitest';
import { demoStore } from '@/lib/services/demo-store';
import { shopService } from '@/lib/services/shop.service';

describe('Garment Price List Service', () => {
  beforeEach(() => {
    // Ensure clean state
    demoStore.resetToSeed();
  });

  it('retrieves default garment price list', async () => {
    const list = await shopService.getGarmentTypes();
    expect(list.length).toBeGreaterThanOrEqual(3);
    const codes = list.map((g) => g.code);
    expect(codes).toContain('top');
    expect(codes).toContain('bottom');
    expect(codes).toContain('blouse');
  });

  it('allows adding a new item and price to the list', async () => {
    const added = await shopService.addGarmentType({
      name: 'Designer Lehenga',
      default_price: 2500,
    });

    expect(added.name).toBe('Designer Lehenga');
    expect(added.default_price).toBe(2500);
    expect(added.is_system).toBe(false);

    const list = await shopService.getGarmentTypes();
    const found = list.find((g) => g.name === 'Designer Lehenga');
    expect(found).toBeDefined();
    expect(found?.default_price).toBe(2500);
  });

  it('updates existing prices across the price list', async () => {
    await shopService.updateGarmentPrices([
      { code: 'top', default_price: 550 },
      { code: 'blouse', default_price: 750 },
    ]);

    const list = await shopService.getGarmentTypes();
    const top = list.find((g) => g.code === 'top');
    const blouse = list.find((g) => g.code === 'blouse');

    expect(top?.default_price).toBe(550);
    expect(blouse?.default_price).toBe(750);
  });

  it('deletes a custom garment item', async () => {
    await shopService.addGarmentType({
      name: 'Custom Gown',
      default_price: 1800,
    });

    let list = await shopService.getGarmentTypes();
    expect(list.some((g) => g.code === 'custom_gown')).toBe(true);

    await shopService.deleteGarmentType('custom_gown');

    list = await shopService.getGarmentTypes();
    expect(list.some((g) => g.code === 'custom_gown')).toBe(false);
  });
});

