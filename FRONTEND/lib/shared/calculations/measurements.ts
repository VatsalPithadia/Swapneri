// ==============================================================================
// lib/shared/calculations/measurements.ts
// Measurement unit conversions and tailoring fraction helpers
// ==============================================================================

import { MeasurementUnit } from '../types/database';

/**
 * Convert inches to centimeters, rounded to 1 decimal place (e.g. 14.5" -> 36.8 cm)
 */
export function inchesToCm(inches: number): number {
  if (typeof inches !== 'number' || isNaN(inches)) return 0;
  return Math.round(inches * 2.54 * 10) / 10;
}

/**
 * Convert centimeters to inches, rounded to the nearest 1/4 inch (tailoring standard)
 */
export function cmToInches(cm: number): number {
  if (typeof cm !== 'number' || isNaN(cm)) return 0;
  const rawInches = cm / 2.54;
  return Math.round(rawInches * 4) / 4;
}

/**
 * Convert a value from one unit to another
 */
export function convertMeasurement(value: number, fromUnit: MeasurementUnit, toUnit: MeasurementUnit): number {
  if (fromUnit === toUnit) return value;
  return fromUnit === 'inches' ? inchesToCm(value) : cmToInches(value);
}

/**
 * Parse an input string that might contain tailoring fraction notation
 * e.g. "14 1/2", "14.5", "14-3/4", "36"
 */
export function parseMeasurementString(input: string | number): {
  decimalValue: number;
  wholeNumber: number;
  fractionPart: string;
} {
  if (typeof input === 'number') {
    const whole = Math.floor(input);
    const dec = Math.round((input - whole) * 100) / 100;
    let fraction = '';
    if (Math.abs(dec - 0.25) < 0.05) fraction = '1/4';
    else if (Math.abs(dec - 0.5) < 0.05) fraction = '1/2';
    else if (Math.abs(dec - 0.75) < 0.05) fraction = '3/4';
    return { decimalValue: input, wholeNumber: whole, fractionPart: fraction };
  }

  const trimmed = input.trim();
  if (!trimmed) return { decimalValue: 0, wholeNumber: 0, fractionPart: '' };

  // Match e.g. "14 1/2" or "14-1/2" or "14 3/4"
  const fractionMatch = trimmed.match(/^(\d+)(?:[\s-]+(\d)\/(\d))?$/);
  if (fractionMatch) {
    const whole = parseInt(fractionMatch[1], 10);
    if (fractionMatch[2] && fractionMatch[3]) {
      const num = parseInt(fractionMatch[2], 10);
      const den = parseInt(fractionMatch[3], 10);
      const fracVal = den !== 0 ? num / den : 0;
      return {
        decimalValue: whole + fracVal,
        wholeNumber: whole,
        fractionPart: `${num}/${den}`,
      };
    }
    return { decimalValue: whole, wholeNumber: whole, fractionPart: '' };
  }

  const parsed = parseFloat(trimmed);
  if (isNaN(parsed)) return { decimalValue: 0, wholeNumber: 0, fractionPart: '' };
  return parseMeasurementString(parsed);
}

/**
 * Format a measurement for display with its unit symbol
 */
export function formatMeasurement(value: number | null | undefined, unit: MeasurementUnit = 'inches', fraction?: string): string {
  if (value === null || value === undefined || isNaN(value)) return '-';

  if (unit === 'cm') {
    return `${value} cm`;
  }

  // If fraction explicitly provided or can be represented nicely
  const whole = Math.floor(value);
  const remainder = Math.round((value - whole) * 100) / 100;
  let fracDisplay = fraction || '';

  if (!fracDisplay) {
    if (Math.abs(remainder - 0.25) < 0.05) fracDisplay = '¼';
    else if (Math.abs(remainder - 0.5) < 0.05) fracDisplay = '½';
    else if (Math.abs(remainder - 0.75) < 0.05) fracDisplay = '¾';
  } else {
    if (fracDisplay === '1/4') fracDisplay = '¼';
    if (fracDisplay === '1/2') fracDisplay = '½';
    if (fracDisplay === '3/4') fracDisplay = '¾';
  }

  if (fracDisplay) {
    return whole > 0 ? `${whole}${fracDisplay}"` : `${fracDisplay}"`;
  }

  return `${value}"`;
}
