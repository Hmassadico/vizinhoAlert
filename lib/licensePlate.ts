/**
 * License Plate Validation for UK and EU countries.
 * Supports: UK, Portugal, France, Germany, Spain, Italy, Netherlands
 */

// License plate patterns by country
const LICENSE_PLATE_PATTERNS: Record<string, RegExp> = {
  // UK (DVLA compliant)
  // Format: AA12AAA, A123ABC, ABC123A
  UK: /^(?:[A-Z]{2}[0-9]{2}[A-Z]{3}|[A-Z][0-9]{1,3}[A-Z]{3}|[A-Z]{3}[0-9]{1,3}[A-Z])$/,

  // Portugal
  // Format: AA12BB, 12AB34
  PT: /^(?:[A-Z]{2}[0-9]{2}[A-Z]{2}|[0-9]{2}[A-Z]{2}[0-9]{2})$/,

  // France
  // Format: AB123CD
  FR: /^[A-Z]{2}[0-9]{3}[A-Z]{2}$/,

  // Germany
  // Format: B1234, MAB123
  DE: /^[A-Z]{1,3}[0-9]{1,4}$/,

  // Spain
  // Format: 1234BCD
  ES: /^[0-9]{4}[A-Z]{3}$/,

  // Italy
  // Format: AB123CD
  IT: /^[A-Z]{2}[0-9]{3}[A-Z]{2}$/,

  // Netherlands
  // Format: AB12CD, 12ABC3
  NL: /^(?:[A-Z]{2}[0-9]{2}[A-Z]{2}|[0-9]{2}[A-Z]{3}[0-9])$/,
};

/**
 * Normalize a license plate:
 * - Convert to uppercase
 * - Trim whitespace
 * - Remove spaces, dashes, dots
 *
 * Example: "ab-12 cde" → "AB12CDE"
 */
export function normalizeLicensePlate(plate: string): string {
  if (!plate) return "";

  // Uppercase and trim
  let normalized = plate.toUpperCase().trim();

  // Remove spaces, dashes, dots
  normalized = normalized.replace(/[\s\-\.]/g, "");

  return normalized;
}

/**
 * Validate a license plate against UK and EU patterns.
 *
 * @param plate - Raw license plate string (will be normalized)
 * @returns Object with isValid and matchedCountry
 */
export function validateLicensePlate(plate: string): {
  isValid: boolean;
  matchedCountry: string | null;
  normalized: string;
} {
  const normalized = normalizeLicensePlate(plate);

  if (!normalized) {
    return { isValid: false, matchedCountry: null, normalized };
  }

  // Check length (most plates are 4-10 characters)
  if (normalized.length < 4 || normalized.length > 10) {
    return { isValid: false, matchedCountry: null, normalized };
  }

  // Try each country pattern
  for (const [country, pattern] of Object.entries(LICENSE_PLATE_PATTERNS)) {
    if (pattern.test(normalized)) {
      return { isValid: true, matchedCountry: country, normalized };
    }
  }

  return { isValid: false, matchedCountry: null, normalized };
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
