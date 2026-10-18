import { describe, it, expect } from 'vitest';
import {
  normalizeBengaliDigits,
  toBengaliDigits,
  normalizeRecordNumber,
  convertToStandardDecimal,
  decimalToSqm,
} from '../services/normalizer';

describe('Normalization Utilities', () => {
  it('converts Bengali digits to English digits accurately', () => {
    expect(normalizeBengaliDigits('১০৪')).toBe('104');
    expect(normalizeBengaliDigits('০১২৩৪৫৬৭৮৯')).toBe('0123456789');
    expect(normalizeBengaliDigits('দাগ নং ২৯০/১')).toBe('দাগ নং 290/1');
    expect(normalizeBengaliDigits('৫০.৫')).toBe('50.5');
  });

  it('converts English digits to Bengali digits accurately', () => {
    expect(toBengaliDigits('104')).toBe('১০৪');
    expect(toBengaliDigits('50.00')).toBe('৫০.০০');
  });

  it('normalizes land identifier prefixes and whitespace', () => {
    expect(normalizeRecordNumber('দাগ নং ১০৪')).toBe('104');
    expect(normalizeRecordNumber('CS Dag # 104')).toBe('104');
    expect(normalizeRecordNumber('খতিয়ান নং ৪৫')).toBe('45');
    expect(normalizeRecordNumber(' 290 / 1 ')).toBe('290/1');
  });

  it('converts area units to standard decimal (শতক)', () => {
    // 1 Acre = 100 decimal
    expect(convertToStandardDecimal(1.0, 'acre')).toBe(100);
    expect(convertToStandardDecimal(0.5, 'acre')).toBe(50);

    // 1 Bigha = 33 decimal
    expect(convertToStandardDecimal(1.0, 'bigha')).toBe(33);
    expect(convertToStandardDecimal(2.0, 'bigha')).toBe(66);

    // 1 Katha = 1.65 decimal
    expect(convertToStandardDecimal(20, 'katha')).toBe(33);

    // decimal stays exact
    expect(convertToStandardDecimal(28.5, 'decimal')).toBe(28.5);
  });

  it('converts standard decimal to square meters correctly', () => {
    // 1 decimal = 40.4686 sqm
    expect(decimalToSqm(1)).toBe(40.47);
    expect(decimalToSqm(50)).toBe(2023.43);
  });
});
