// ==============================================================================
// lib/shared/constants/garments.ts
// Workshop measurement slip fields: Top, Bottom, and Blouse
// Clean English only - no unit toggles or unnecessary text
// ==============================================================================

export interface MeasurementFieldConfig {
  key: string;
  label: string;
  placeholder?: string;
  isText?: boolean;
  syncToBlouse?: boolean;
}

export interface GarmentConfig {
  code: string;
  name: string;
  defaultPrice: number;
  icon: string;
  fields: MeasurementFieldConfig[];
}

export const WOMEN_GARMENTS: Record<string, GarmentConfig> = {
  top: {
    code: 'top',
    name: 'Top',
    defaultPrice: 650,
    icon: 'Shirt',
    fields: [
      { key: 'top_length', label: 'Top Length' },
      { key: 'frock_length', label: 'Frock Length' },
      { key: 'gown_length', label: 'Gown Length' },
      { key: 'sleeve_full_len', label: 'Full Sleeve Length' },
      { key: 'sleeve_full_mori', label: 'Full Sleeve Mori' },
      { key: 'sleeve_three_fourth_len', label: '3/4 Sleeve Length' },
      { key: 'sleeve_three_fourth_mori', label: '3/4 Sleeve Mori' },
      { key: 'sleeve_short_len', label: 'Short Sleeve Length' },
      { key: 'sleeve_short_mori', label: 'Short Sleeve Mori' },
      { key: 'shoulder', label: 'Shoulder', syncToBlouse: true },
      { key: 'chest', label: 'Chest', syncToBlouse: true },
      { key: 'chest_note', label: 'Chest Note', isText: true },
      { key: 'waist', label: 'Waist', syncToBlouse: true },
      { key: 'waist_note', label: 'Waist Note', isText: true },
      { key: 'seat_hip', label: 'Seat / Hip' },
      { key: 'seat_note', label: 'Seat Note', isText: true },
    ],
  },

  bottom: {
    code: 'bottom',
    name: 'Bottom',
    defaultPrice: 550,
    icon: 'Columns',
    fields: [
      { key: 'pant_length', label: 'Pant Length' },
      { key: 'pant_mori', label: 'Pant Mori' },
      { key: 'pant_other', label: 'Pant Other / Note', isText: true },
      { key: 'plazo_length', label: 'Palazzo Length' },
      { key: 'plazo_mori', label: 'Palazzo Mori' },
      { key: 'panjabi_length', label: 'Punjabi Salwar Length' },
      { key: 'panjabi_mori', label: 'Punjabi Salwar Mori' },
    ],
  },

  blouse: {
    code: 'blouse',
    name: 'Blouse',
    defaultPrice: 850,
    icon: 'Scissors',
    fields: [
      { key: 'blouse_length', label: 'Blouse Length' },
      { key: 'blouse_sleeve_long_len', label: 'Long Sleeve Length' },
      { key: 'blouse_sleeve_long_mori', label: 'Long Sleeve Mori' },
      { key: 'blouse_sleeve_short_len', label: 'Short Sleeve Length' },
      { key: 'blouse_sleeve_short_mori', label: 'Short Sleeve Mori' },
      { key: 'bicep_bayshep', label: 'Bicep (Bayshep)' },
      { key: 'armhole_mundo', label: 'Armhole' },
      { key: 'chest', label: 'Chest' },
      { key: 'waist', label: 'Waist' },
      { key: 'shoulder', label: 'Shoulder' },
    ],
  },
};

// Aliases for backward compatibility (non-enumerable so Object.values() stays 100% unique)
Object.defineProperty(WOMEN_GARMENTS, 'kurti', {
  value: WOMEN_GARMENTS.top,
  enumerable: false,
  writable: true,
  configurable: true,
});
Object.defineProperty(WOMEN_GARMENTS, 'salwar_pant', {
  value: WOMEN_GARMENTS.bottom,
  enumerable: false,
  writable: true,
  configurable: true,
});
