"""
License Plate Validation for UK and EU countries.
Supports: UK, Portugal, France, Germany, Spain, Italy, Netherlands
"""
import re
from dataclasses import dataclass
from typing import Optional, Tuple, List


@dataclass(frozen=True)
class PlateRule:
    """License plate validation rule with country info"""
    country_code: str
    country_name: str
    pattern: re.Pattern
    example: str


# Pre-compiled patterns for better performance
PLATE_RULES: List[PlateRule] = [
    # UK (DVLA compliant - current format)
    PlateRule("UK", "United Kingdom (DVLA)", re.compile(r"^[A-Z]{2}[0-9]{2}[A-Z]{3}$"), "AB12CDE"),
    # UK older styles
    PlateRule("UK", "United Kingdom (Older)", re.compile(r"^[A-Z][0-9]{1,3}[A-Z]{3}$"), "A123BCD"),
    PlateRule("UK", "United Kingdom (Older)", re.compile(r"^[A-Z]{3}[0-9]{1,3}[A-Z]$"), "ABC123D"),

    # Portugal
    PlateRule("PT", "Portugal", re.compile(r"^(?:[A-Z]{2}[0-9]{2}[A-Z]{2}|[0-9]{2}[A-Z]{2}[0-9]{2})$"), "AA12BB"),

    # France
    PlateRule("FR", "France", re.compile(r"^[A-Z]{2}[0-9]{3}[A-Z]{2}$"), "AB123CD"),

    # Italy (same structure as FR)
    PlateRule("IT", "Italy", re.compile(r"^[A-Z]{2}[0-9]{3}[A-Z]{2}$"), "AB123CD"),

    # Spain
    PlateRule("ES", "Spain", re.compile(r"^[0-9]{4}[A-Z]{3}$"), "1234BCD"),

    # Netherlands (common modern)
    PlateRule("NL", "Netherlands", re.compile(r"^(?:[A-Z]{2}[0-9]{2}[A-Z]{2}|[0-9]{2}[A-Z]{3}[0-9])$"), "AB12CD"),

    # Germany (approx: 1-3 letters (city), 1-2 letters (series) optional, then 1-4 digits)
    PlateRule("DE", "Germany", re.compile(r"^[A-Z]{1,3}[A-Z]{0,2}[0-9]{1,4}$"), "B1234"),
]

# Legacy dict format for backwards compatibility
LICENSE_PLATE_PATTERNS = {
    "UK": r"^(?:[A-Z]{2}[0-9]{2}[A-Z]{3}|[A-Z][0-9]{1,3}[A-Z]{3}|[A-Z]{3}[0-9]{1,3}[A-Z])$",
    "PT": r"^(?:[A-Z]{2}[0-9]{2}[A-Z]{2}|[0-9]{2}[A-Z]{2}[0-9]{2})$",
    "FR": r"^[A-Z]{2}[0-9]{3}[A-Z]{2}$",
    "DE": r"^[A-Z]{1,3}[A-Z]{0,2}[0-9]{1,4}$",
    "ES": r"^[0-9]{4}[A-Z]{3}$",
    "IT": r"^[A-Z]{2}[0-9]{3}[A-Z]{2}$",
    "NL": r"^(?:[A-Z]{2}[0-9]{2}[A-Z]{2}|[0-9]{2}[A-Z]{3}[0-9])$",
}


def normalize_license_plate(plate: str) -> str:
    """
    Normalize a license plate:
    - Convert to uppercase
    - Trim whitespace
    - Remove spaces, dashes, dots, underscores
    
    Example: "ab-12 cde" → "AB12CDE"
    """
    if plate is None:
        return ""
    
    # Uppercase and strip
    normalized = plate.strip().upper()
    
    # Remove spaces, dashes, dots, underscores
    normalized = re.sub(r"[\s\-\.\_]", "", normalized)
    
    return normalized


def detect_plate_country(plate: str) -> Optional[Tuple[str, str]]:
    """
    Detect country from license plate format.
    
    Args:
        plate: Raw or normalized license plate string
        
    Returns:
        Tuple of (country_code, country_name) or None if no match
    """
    plate_norm = normalize_license_plate(plate)
    
    for rule in PLATE_RULES:
        if rule.pattern.match(plate_norm):
            return (rule.country_code, rule.country_name)
    
    return None


def validate_license_plate(plate: str) -> Tuple[bool, Optional[str]]:
    """
    Validate a license plate against UK and EU patterns.
    
    Args:
        plate: Raw license plate string (will be normalized)
        
    Returns:
        Tuple of (is_valid, matched_country_code)
        - (True, "UK") if valid UK plate
        - (True, "FR") if valid French plate
        - (False, None) if no pattern matches
    """
    normalized = normalize_license_plate(plate)
    
    if not normalized:
        return False, None
    
    # Check length (most plates are 4-10 characters)
    if len(normalized) < 4 or len(normalized) > 10:
        return False, None
    
    # Use detect_plate_country for matching
    match = detect_plate_country(normalized)
    if match:
        return True, match[0]
    
    return False, None


def is_valid_license_plate(plate: str) -> bool:
    """
    Simple boolean check if license plate is valid for UK or EU.
    """
    is_valid, _ = validate_license_plate(plate)
    return is_valid


def get_normalized_plate(plate: str) -> Optional[str]:
    """
    Get normalized plate only if it's valid.
    Returns None if plate is invalid.
    """
    is_valid, _ = validate_license_plate(plate)
    if is_valid:
        return normalize_license_plate(plate)
    return None


def validate_plate_or_raise(plate: str) -> Tuple[str, str, str]:
    """
    Validate plate and return details, or raise ValueError if invalid.
    
    Args:
        plate: Raw license plate string
        
    Returns:
        Tuple of (normalized_plate, country_code, country_name)
        
    Raises:
        ValueError: If plate format is invalid
    """
    plate_norm = normalize_license_plate(plate)
    match = detect_plate_country(plate_norm)
    
    if not match:
        examples = ", ".join(sorted({r.example for r in PLATE_RULES}))
        raise ValueError(f"Invalid license plate format (UK/EU). Examples: {examples}")
    
    return plate_norm, match[0], match[1]
