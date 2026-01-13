/**
 * License Plate Validation for GB, IE, and common European formats.
 * Supports: GB, IE, PT, ES, FR, DE, IT, NL, BE, CH, AT, SE, NO, DK, PL
 */

interface PlateRule {
  countryCode: string;
  countryName: string;
  pattern: RegExp;
  example: string;
}

// Pre-compiled patterns with country info
const PLATE_RULES: PlateRule[] = [
  // Great Britain (DVLA current format)
  { countryCode: "GB", countryName: "Great Britain (DVLA)", pattern: /^[A-Z]{2}[0-9]{2}[A-Z]{3}$/, example: "AB12CDE" },
  // GB older styles
  { countryCode: "GB", countryName: "Great Britain (Older)", pattern: /^[A-Z][0-9]{1,3}[A-Z]{3}$/, example: "A123BCD" },
  { countryCode: "GB", countryName: "Great Britain (Older)", pattern: /^[A-Z]{3}[0-9]{1,3}[A-Z]$/, example: "ABC123D" },

  // Ireland
  { countryCode: "IE", countryName: "Ireland", pattern: /^[0-9]{2,3}[A-Z]{1,2}[0-9]{1,6}$/, example: "12D12345" },

  // Portugal
  { countryCode: "PT", countryName: "Portugal", pattern: /^[A-Z]{2}[0-9]{2}[A-Z]{2}$/, example: "AA12BB" },
  { countryCode: "PT", countryName: "Portugal", pattern: /^[0-9]{2}[A-Z]{2}[0-9]{2}$/, example: "12AA34" },

  // Spain
  { countryCode: "ES", countryName: "Spain", pattern: /^[0-9]{4}[A-Z]{3}$/, example: "1234ABC" },

  // France (new format 2009+)
  { countryCode: "FR", countryName: "France", pattern: /^[A-Z]{2}[0-9]{3}[A-Z]{2}$/, example: "AA123AA" },

  // Germany
  { countryCode: "DE", countryName: "Germany", pattern: /^[A-Z]{1,3}[A-Z]{1,2}[0-9]{1,4}$/, example: "BAB1234" },
  { countryCode: "DE", countryName: "Germany", pattern: /^[A-Z]{1,3}[0-9]{1,4}$/, example: "B1234" },

  // Italy
  { countryCode: "IT", countryName: "Italy", pattern: /^[A-Z]{2}[0-9]{3}[A-Z]{2}$/, example: "AB123CD" },

  // Netherlands
  { countryCode: "NL", countryName: "Netherlands", pattern: /^[A-Z]{2}[0-9]{2}[A-Z]{2}$/, example: "AB12CD" },
  { countryCode: "NL", countryName: "Netherlands", pattern: /^[0-9]{2}[A-Z]{3}[0-9]$/, example: "12ABC3" },
  { countryCode: "NL", countryName: "Netherlands", pattern: /^[0-9][A-Z]{3}[0-9]{2}$/, example: "1ABC23" },

  // Belgium
  { countryCode: "BE", countryName: "Belgium", pattern: /^[0-9][A-Z]{3}[0-9]{3}$/, example: "1ABC123" },
  { countryCode: "BE", countryName: "Belgium", pattern: /^[A-Z]{3}[0-9]{3}$/, example: "ABC123" },

  // Switzerland
  { countryCode: "CH", countryName: "Switzerland", pattern: /^[A-Z]{2}[0-9]{1,6}$/, example: "ZH123456" },

  // Austria
  { countryCode: "AT", countryName: "Austria", pattern: /^[A-Z]{1,2}[0-9]{1,5}[A-Z]{1,2}$/, example: "W12345A" },

  // Sweden
  { countryCode: "SE", countryName: "Sweden", pattern: /^[A-Z]{3}[0-9]{2}[A-Z0-9]$/, example: "ABC12D" },

  // Norway
  { countryCode: "NO", countryName: "Norway", pattern: /^[A-Z]{2}[0-9]{5}$/, example: "AB12345" },

  // Denmark
  { countryCode: "DK", countryName: "Denmark", pattern: /^[A-Z]{2}[0-9]{5}$/, example: "AB12345" },

  // Poland
  { countryCode: "PL", countryName: "Poland", pattern: /^[A-Z]{2,3}[A-Z0-9]{4,5}$/, example: "WA12345" },
];

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
  GB: "AB12CDE",
  IE: "12D12345",
  PT: "12AA34",
  FR: "AA123AA",
  DE: "BAB1234",
  ES: "1234ABC",
  IT: "AB123CD",
  NL: "AB12CD",
  BE: "1ABC123",
  CH: "ZH123456",
  AT: "W12345A",
  SE: "ABC12D",
  NO: "AB12345",
  DK: "AB12345",
  PL: "WA12345",
} as const;

// Export PLATE_RULES for external use
export { PLATE_RULES };
