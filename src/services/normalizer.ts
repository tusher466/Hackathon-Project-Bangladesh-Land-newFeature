import { AreaUnit } from '../types';

/**
 * Normalization utilities for Bangladesh Historical Land Records.
 * 
 * Rules:
 * 1. Bengali Numerals: '০','১','২','৩','৪','৫','৬','৭','৮','৯' mapped to '0'-'9'.
 * 2. Land Area Units (Standard Bangladesh Revenue definitions):
 *    - 1 Decimal (শতক / শতাংশ) = 435.6 sq ft = 40.4686 sq meters
 *    - 1 Acre (একর) = 100 Decimal
 *    - 1 Standard Bigha (বিঘা) = 33 Decimal (20 Kathas)
 *    - 1 Standard Katha (কাঠা) = 1.65 Decimal (720 sq ft)
 *    - 1 Sq Meter = 0.0247105 Decimal
 *    - 1 Sq Foot = 0.00229568 Decimal
 */

const BN_TO_EN_DIGITS: Record<string, string> = {
  '০': '0',
  '১': '1',
  '২': '2',
  '৩': '3',
  '৪': '4',
  '৫': '5',
  '৬': '6',
  '৭': '7',
  '৮': '8',
  '৯': '9',
};

const EN_TO_BN_DIGITS: Record<string, string> = {
  '0': '০',
  '1': '১',
  '2': '২',
  '3': '৩',
  '4': '৪',
  '5': '৫',
  '6': '৬',
  '7': '৭',
  '8': '৮',
  '9': '৯',
};

/**
 * Converts Bengali digits in any string into standard English digits.
 */
export function normalizeBengaliDigits(input: string | number | null | undefined): string {
  if (input === null || input === undefined) return '';
  const str = String(input);
  return str.replace(/[০-৯]/g, (char) => BN_TO_EN_DIGITS[char] || char);
}

/**
 * Converts English digits to Bengali digits.
 */
export function toBengaliDigits(input: string | number | null | undefined): string {
  if (input === null || input === undefined) return '';
  const str = String(input);
  return str.replace(/[0-9]/g, (char) => EN_TO_BN_DIGITS[char] || char);
}

/**
 * Cleans and normalizes land identifier strings (Dag, Khatian, JL numbers).
 * Removes leading prefixes like "দাগ নং", "CS Dag #", "খতিয়ান", "JL-", punctuation, and extra spaces.
 */
export function normalizeRecordNumber(raw: string | number | null | undefined): string {
  if (raw === null || raw === undefined) return '';
  let str = normalizeBengaliDigits(raw).trim();
  
  // Remove common prefix markers with spaces (e.g. "দাগ নং", "খতিয়ান নং", "CS Dag #")
  str = str.replace(/^(?:(?:দাগ|খতিয়ান|জেএল|জে\.এল\.|নং|dag|khatian|jl|no|#|:|-|\.)\s*)+/gi, '');
  str = str.replace(/^(?:(?:cs|sa|rs|bs|brs)\s*(?:dag|khatian|no)?\s*[:#-]?\s*)+/gi, '');
  
  // Clean whitespace and normalize slash notations (e.g. 104 / 1 -> 104/1)
  str = str.replace(/\s*\/\s*/g, '/').trim();
  return str;
}

/**
 * Normalizes an area value with its specified unit to standard Decimal (শতক).
 */
export function convertToStandardDecimal(area: number, unit: AreaUnit): number {
  if (isNaN(area) || area <= 0) return 0;
  
  switch (unit) {
    case 'decimal':
      return Number(area.toFixed(4));
    case 'acre':
      return Number((area * 100).toFixed(4));
    case 'bigha':
      return Number((area * 33).toFixed(4));
    case 'katha':
      return Number((area * 1.65).toFixed(4));
    case 'sqm':
      return Number((area * 0.0247105).toFixed(4));
    case 'sqft':
      return Number((area * 0.00229568).toFixed(4));
    default:
      return Number(area.toFixed(4));
  }
}

/**
 * Converts standard Decimal to Square Meters.
 */
export function decimalToSqm(decimal: number): number {
  return Number((decimal * 40.4686).toFixed(2));
}

/**
 * Normalizes user text query for search comparison.
 */
export function normalizeSearchTerm(term: string): string {
  if (!term) return '';
  return normalizeBengaliDigits(term.toLowerCase().trim());
}

/**
 * Returns formatted area string in both Bengali and English units.
 */
export function formatAreaDisplay(decimal: number): { en: string; bn: string } {
  const decStr = decimal.toFixed(2);
  const bnDecStr = toBengaliDigits(decStr);
  
  if (decimal >= 100) {
    const acreVal = (decimal / 100).toFixed(2);
    return {
      en: `${decStr} decimal (${acreVal} acre)`,
      bn: `${bnDecStr} শতক (${toBengaliDigits(acreVal)} একর)`,
    };
  }
  
  return {
    en: `${decStr} decimal`,
    bn: `${bnDecStr} শতক`,
  };
}
