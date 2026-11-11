import { describe, it, expect } from 'vitest';
import {
  inchesToCm,
  cmToInches,
  convertMeasurement,
  parseMeasurementString,
  formatMeasurement,
} from '../../lib/shared/calculations/measurements';

describe('Measurement Unit Conversions & Tailoring Fractions', () => {
  it('converts inches to centimeters accurately', () => {
    expect(inchesToCm(10)).toBe(25.4);
    expect(inchesToCm(14.5)).toBe(36.8);
    expect(inchesToCm(36)).toBe(91.4);
  });

  it('converts centimeters to inches rounded to tailoring quarters', () => {
    // 36.8 cm / 2.54 = 14.488 -> rounds to 14.5 (14 1/2")
    expect(cmToInches(36.8)).toBe(14.5);
    // 25.4 cm / 2.54 = 10.0
    expect(cmToInches(25.4)).toBe(10);
  });

  it('bidirectionally converts between units', () => {
    expect(convertMeasurement(14, 'inches', 'cm')).toBe(35.6);
    expect(convertMeasurement(35.6, 'cm', 'inches')).toBe(14);
    expect(convertMeasurement(14, 'inches', 'inches')).toBe(14);
  });

  it('parses fraction strings used by tailors', () => {
    const p1 = parseMeasurementString('14 1/2');
    expect(p1.wholeNumber).toBe(14);
    expect(p1.fractionPart).toBe('1/2');
    expect(p1.decimalValue).toBe(14.5);

    const p2 = parseMeasurementString('36 3/4');
    expect(p2.decimalValue).toBe(36.75);

    const p3 = parseMeasurementString(14.25);
    expect(p3.fractionPart).toBe('1/4');
  });

  it('formats measurements with nice tailoring symbols', () => {
    expect(formatMeasurement(14.5, 'inches')).toBe('14½"');
    expect(formatMeasurement(36.25, 'inches')).toBe('36¼"');
    expect(formatMeasurement(9.75, 'inches')).toBe('9¾"');
    expect(formatMeasurement(14, 'inches')).toBe('14"');
    expect(formatMeasurement(35.6, 'cm')).toBe('35.6 cm');
  });
});
