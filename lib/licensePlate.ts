/**
 * License Plate Validation for UK and EU countries.
 * Supports: UK, Portugal, France, Germany, Spain, Italy, Netherlands
 */

interface PlateRule {
  countryCode: string;
  countryName: string;
  pattern: RegExp;
  example: string;
}

// Pre-compiled patterns with country info
const PLATE_RULES: PlateRule[] = [
  // UK (DVLA compliant - current format)
  { countryCode: "UK", countryName: "United Kingdom (DVLA)", pattern: /^[A-Z]{2}[0-9]{2}[A-Z]{3}$/, example: "AB12CDE" },
  // UK older styles
  { countryCode: "UK", countryName: "United Kingdom (Older)", pattern: /^[A-Z][0-9]{1,3}[A-Z]{3}$/, example: "A123BCD" },
  { countryCode: "UK", countryName: "United Kingdom (Older)", pattern: /^[A-Z]{3}[0-9]{1,3}[A-Z]$/, example: "ABC123D" },

  // Portugal
  { countryCode: "PT", countryName: "Portugal", pattern: /^(?:[A-Z]{2}[0-9]{2}[A-Z]{2}|[0-9]{2}[A-Z]{2}[0-9]{2})$/, example: "AA12BB" },

  // France
  { countryCode: "FR", countryName: "France", pattern: /^[A-Z]{2}[0-9]{3}[A-Z]{2}$/, example: "AB123CD" },

  // Italy (same structure as FR)
  { countryCode: "IT", countryName: "Italy", pattern: /^[A-Z]{2}[0-9]{3}[A-Z]{2}$/, example: "AB123CD" },

  // Spain
  { countryCode: "ES", countryName: "Spain", pattern: /^[0-9]{4}[A-Z]{3}$/, example: "1234BCD" },

  // Netherlands (common modern)
  { countryCode: "NL", countryName: "Netherlands", pattern: /^(?:[A-Z]{2}[0-9]{2}[A-Z]{2}|[0-9]{2}[A-Z]{3}[0-9])$/, example: "AB12CD" },

  // Germany (approx: 1-3 letters (city), 1-2 letters (series) optional, then 1-4 digits)
  { countryCode: "DE", countryName: "Germany", pattern: /^[A-Z]{1,3}[A-Z]{0,2}[0-9]{1,4}$/, example: "B1234" },
];

// Legacy dict format for backwards compatibility
const LICENSE_PLATE_PATTERNS: Record<string, RegExp> = {
  UK: /^(?:[A-Z]{2}[0-9]{2}[A-Z]{3}|[A-Z][0-9]{1,3}[A-Z]{3}|[A-Z]{3}[0-9]{1,3}[A-Z])$/,
  PT: /^(?:[A-Z]{2}[0-9]{2}[A-Z]{2}|[0-9]{2}[A-Z]{2}[0-9]{2})$/,
  FR: /^[A-Z]{2}[0-9]{3}[A-Z]{2}$/,
  DE: /^[A-Z]{1,3}[A-Z]{0,2}[0-9]{1,4}$/,
  ES: /^[0-9]{4}[A-Z]{3}$/,
  IT: /^[A-Z]{2}[0-9]{3}[A-Z]{2}$/,
  NL: /^(?:[A-Z]{2}[0-9]{2}[A-Z]{2}|[0-9]{2}[A-Z]{3}[0-9])$/,
};

/**
 * Normalize a license plate:
 * - Convert to uppercase
 * - Trim whitespace
 * - Remove spaces, dashes, dots, underscores
 *
 * Example: "ab-12 cde" → "AB12CDE"
 */
export function normalizeLicensePlate(plate: string): string {
  if (!plate) return "";

  // Uppercase and trim
  let normalized = plate.toUpperCase().trim();

  // Remove spaces, dashes, dots, underscores
  normalized = normalized.replace(/[\s\-\.\_]/g, "");

  return normalized;
}

/**
 * Detect country from license plate format.
 *
 * @param plate - Raw or normalized license plate string
 * @returns Object with countryCode and countryName, or null if no match
 */
export function detectPlateCountry(plate: string): {
  countryCode: string;
  countryName: string;
} | null {
  const normalized = normalizeLicensePlate(plate);

  for (const rule of PLATE_RULES) {
    if (rule.pattern.test(normalized)) {
      return { countryCode: rule.countryCode, countryName: rule.countryName };
    }
  }

  return null;
}

/**
 * Validate a license plate against UK and EU patterns.
 *
 * @param plate - Raw license plate string (will be normalized)
 * @returns Object with isValid, matchedCountry, countryName, and normalized
 */
export function validateLicensePlate(plate: string): {
  isValid: boolean;
  matchedCountry: string | null;
  countryName: string | null;
  normalized: string;
} {
  const normalized = normalizeLicensePlate(plate);

  if (!normalized) {
    return { isValid: false, matchedCountry: null, countryName: null, normalized };
  }

  // Check length (most plates are 4-10 characters)
  if (normalized.length < 4 || normalized.length > 10) {
    return { isValid: false, matchedCountry: null, countryName: null, normalized };
  }

  // Use detectPlateCountry for matching
  const match = detectPlateCountry(normalized);
  if (match) {
    return {
      isValid: true,
      matchedCountry: match.countryCode,
      countryName: match.countryName,
      normalized,
    };
  }

  return { isValid: false, matchedCountry: null, countryName: null, normalized };
}

/**
 * Simple boolean check if license plate is valid for UK or EU.
 */
export function isValidLicensePlate(plate: string): boolean {
  const { isValid } = validateLicensePlate(plate);
  return isValid;
}

/**
 * Get validation error message if plate is invalid.
 */
export function getLicensePlateError(plate: string): string | null {
  const normalized = normalizeLicensePlate(plate);

  if (!normalized) {
    return "Please enter a license plate";
  }

  if (normalized.length < 4) {
    return "License plate is too short";
  }

  if (normalized.length > 10) {
    return "License plate is too long";
  }

  const { isValid } = validateLicensePlate(plate);
  if (!isValid) {
    return "Enter a valid UK or European license plate";
  }

  return null;
}

// Test plates for reference
export const TEST_PLATES = {
  UK: "AB12CDE",
  PT: "AA12BB",
  FR: "AB123CD",
  DE: "B1234",
  ES: "1234BCD",
  IT: "AB123CD",
  NL: "AB12CD",
} as const;

// Export PLATE_RULES for external use
export { PLATE_RULES };
