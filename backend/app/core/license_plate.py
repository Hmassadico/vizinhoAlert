"""
License Plate Validation for UK and EU countries.
Supports: UK, Portugal, France, Germany, Spain, Italy, Netherlands
"""
import re
from typing import Optional, Tuple


# License plate patterns by country
LICENSE_PLATE_PATTERNS = {
    # UK (DVLA compliant)
    # Format: AA12AAA, A123ABC, ABC123A
    "UK": r"^(?:[A-Z]{2}[0-9]{2}[A-Z]{3}|[A-Z][0-9]{1,3}[A-Z]{3}|[A-Z]{3}[0-9]{1,3}[A-Z])$",
    
    # Portugal
    # Format: AA12BB, 12AB34
    "PT": r"^(?:[A-Z]{2}[0-9]{2}[A-Z]{2}|[0-9]{2}[A-Z]{2}[0-9]{2})$",
    
    # France
    # Format: AB123CD
    "FR": r"^[A-Z]{2}[0-9]{3}[A-Z]{2}$",
    
    # Germany
    # Format: B1234, MAB123
    "DE": r"^[A-Z]{1,3}[0-9]{1,4}$",
    
    # Spain
    # Format: 1234BCD
    "ES": r"^[0-9]{4}[A-Z]{3}$",
    
    # Italy
    # Format: AB123CD
    "IT": r"^[A-Z]{2}[0-9]{3}[A-Z]{2}$",
    
    # Netherlands
    # Format: AB12CD, 12ABC3
    "NL": r"^(?:[A-Z]{2}[0-9]{2}[A-Z]{2}|[0-9]{2}[A-Z]{3}[0-9])$",
}


def normalize_license_plate(plate: str) -> str:
    """
    Normalize a license plate:
    - Convert to uppercase
    - Trim whitespace
    - Remove spaces, dashes, dots
    
    Example: "ab-12 cde" → "AB12CDE"
    """
    if not plate:
        return ""
    
    # Uppercase and strip
    normalized = plate.upper().strip()
    
    # Remove spaces, dashes, dots
    normalized = re.sub(r"[\s\-\.]", "", normalized)
    
    return normalized


def validate_license_plate(plate: str) -> Tuple[bool, Optional[str]]:
    """
    Validate a license plate against UK and EU patterns.
    
    Args:
        plate: Raw license plate string (will be normalized)
        
    Returns:
        Tuple of (is_valid, matched_country)
        - (True, "UK") if valid UK plate
        - (True, "FR") if valid French plate
        - (False, None) if no pattern matches
    """
    normalized = normalize_license_plate(plate)
    
    if not normalized:
        return False, None
    
    # Check length (most plates are 5-8 characters)
    if len(normalized) < 4 or len(normalized) > 10:
        return False, None
    
    # Try each country pattern
    for country, pattern in LICENSE_PLATE_PATTERNS.items():
        if re.match(pattern, normalized):
            return True, country
    
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
