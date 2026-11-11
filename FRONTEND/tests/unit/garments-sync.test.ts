import { describe, it, expect } from 'vitest';
import { WOMEN_GARMENTS } from '../../lib/shared/constants/garments';
import { customerSchema } from '../../lib/shared/validation/customer.schema';

describe('Garment Configurations & Tailor Slip Structure', () => {
  it('restricts garment categories to strictly Top, Bottom, and Blouse', () => {
    const keys = Object.keys(WOMEN_GARMENTS).filter((k) => k === 'top' || k === 'bottom' || k === 'blouse');
    expect(keys).toEqual(['top', 'bottom', 'blouse']);
    expect(WOMEN_GARMENTS.top.name).toBe('Top');
    expect(WOMEN_GARMENTS.bottom.name).toBe('Bottom');
    expect(WOMEN_GARMENTS.blouse.name).toBe('Blouse');
  });

  it('includes all fields in Top from handwritten slip (lengths, sleeves with mori, body with notes)', () => {
    const topKeys = WOMEN_GARMENTS.top.fields.map((f) => f.key);

    // Lengths
    expect(topKeys).toContain('top_length');
    expect(topKeys).toContain('frock_length');
    expect(topKeys).toContain('gown_length');

    // Sleeves with Mori
    expect(topKeys).toContain('sleeve_full_len');
    expect(topKeys).toContain('sleeve_full_mori');
    expect(topKeys).toContain('sleeve_three_fourth_len');
    expect(topKeys).toContain('sleeve_three_fourth_mori');
    expect(topKeys).toContain('sleeve_short_len');
    expect(topKeys).toContain('sleeve_short_mori');

    // Shoulder & Body
    expect(topKeys).toContain('shoulder');
    expect(topKeys).toContain('chest');
    expect(topKeys).toContain('waist');
    expect(topKeys).toContain('seat_hip');

    // Notes
    expect(topKeys).toContain('chest_note');
    expect(topKeys).toContain('waist_note');
    expect(topKeys).toContain('seat_note');
  });

  it('includes all fields in Bottom from handwritten slip (Pant, Palazzo, Punjabi Salwar)', () => {
    const bottomKeys = WOMEN_GARMENTS.bottom.fields.map((f) => f.key);

    // Pant
    expect(bottomKeys).toContain('pant_length');
    expect(bottomKeys).toContain('pant_mori');
    expect(bottomKeys).toContain('pant_other');

    // Palazzo
    expect(bottomKeys).toContain('plazo_length');
    expect(bottomKeys).toContain('plazo_mori');

    // Punjabi Salwar
    expect(bottomKeys).toContain('panjabi_length');
    expect(bottomKeys).toContain('panjabi_mori');
  });

  it('includes blouse fields and bodily dimensions (Chest, Waist, Shoulder)', () => {
    const blouseFields = WOMEN_GARMENTS.blouse.fields;
    const blouseKeys = blouseFields.map((f) => f.key);

    expect(blouseKeys).toContain('blouse_length');
    expect(blouseKeys).toContain('blouse_sleeve_long_len');
    expect(blouseKeys).toContain('blouse_sleeve_long_mori');
    expect(blouseKeys).toContain('blouse_sleeve_short_len');
    expect(blouseKeys).toContain('blouse_sleeve_short_mori');
    expect(blouseKeys).toContain('bicep_bayshep');
    expect(blouseKeys).toContain('armhole_mundo');
    expect(blouseKeys).toContain('chest');
    expect(blouseKeys).toContain('waist');
    expect(blouseKeys).toContain('shoulder');
  });

  it('validates customer form schema with address and notes fields', () => {
    const customer = {
      name: 'Rekha Ben',
      phone: '9825012345',
      address: 'Plot 45, Sardar Patel Colony, Navrangpura, Ahmedabad',
      notes: 'Prefers deep back neck with latkan, cigarette pant with 1 pocket',
    };

    const res = customerSchema.safeParse(customer);
    expect(res.success).toBe(true);
  });
});
