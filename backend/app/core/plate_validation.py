"""
License Plate Validation for UK/GB, Ireland, and common European formats.
Supports: GB, IE, PT, ES, FR, DE, IT, NL, BE, CH, AT, SE, NO, DK, PL
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


def normalize_plate(raw: str) -> str:
    """
    Normalize a license plate:
    - Convert to uppercase
    - Trim whitespace
    - Collapse internal whitespace and remove dashes/dots/underscores
    
    Example: "ab-12 cde" → "AB12CDE"
    """
    if raw is None:
        return ""
    
    # Uppercase and strip outer whitespace
    normalized = raw.strip().upper()
    
    # Remove spaces, dashes, dots, underscores
    normalized = re.sub(r"[\s\-\.\\_]+", "", normalized)
    
    return normalized


# Pre-compiled patterns for all supported countries
PLATE_RULES: List[PlateRule] = [
    # Great Britain (DVLA current format)
    PlateRule("GB", "Great Britain (DVLA)", re.compile(r"^[A-Z]{2}[0-9]{2}[A-Z]{3}$"), "AB12CDE"),
    # GB older styles
    PlateRule("GB", "Great Britain (Older)", re.compile(r"^[A-Z][0-9]{1,3}[A-Z]{3}$"), "A123BCD"),
    PlateRule("GB", "Great Britain (Older)", re.compile(r"^[A-Z]{3}[0-9]{1,3}[A-Z]$"), "ABC123D"),

    # Ireland (IE)
    PlateRule("IE", "Ireland", re.compile(r"^[0-9]{2,3}[A-Z]{1,2}[0-9]{1,6}$"), "12D12345"),

    # Portugal (PT)
    PlateRule("PT", "Portugal", re.compile(r"^[A-Z]{2}[0-9]{2}[A-Z]{2}$"), "AA12BB"),
    PlateRule("PT", "Portugal", re.compile(r"^[0-9]{2}[A-Z]{2}[0-9]{2}$"), "12AA34"),

    # Spain (ES)
    PlateRule("ES", "Spain", re.compile(r"^[0-9]{4}[A-Z]{3}$"), "1234ABC"),

    # France (FR) - new format (2009+)
    PlateRule("FR", "France", re.compile(r"^[A-Z]{2}[0-9]{3}[A-Z]{2}$"), "AA123AA"),

    # Germany (DE) - city code (1-3), letters (1-2), digits (1-4)
    PlateRule("DE", "Germany", re.compile(r"^[A-Z]{1,3}[A-Z]{1,2}[0-9]{1,4}$"), "BAB1234"),
    PlateRule("DE", "Germany", re.compile(r"^[A-Z]{1,3}[0-9]{1,4}$"), "B1234"),

    # Italy (IT) - same format as France
    PlateRule("IT", "Italy", re.compile(r"^[A-Z]{2}[0-9]{3}[A-Z]{2}$"), "AB123CD"),

    # Netherlands (NL)
    PlateRule("NL", "Netherlands", re.compile(r"^[A-Z]{2}[0-9]{2}[A-Z]{2}$"), "AB12CD"),
    PlateRule("NL", "Netherlands", re.compile(r"^[0-9]{2}[A-Z]{3}[0-9]$"), "12ABC3"),
    PlateRule("NL", "Netherlands", re.compile(r"^[0-9][A-Z]{3}[0-9]{2}$"), "1ABC23"),

    # Belgium (BE)
    PlateRule("BE", "Belgium", re.compile(r"^[0-9][A-Z]{3}[0-9]{3}$"), "1ABC123"),
    PlateRule("BE", "Belgium", re.compile(r"^[A-Z]{3}[0-9]{3}$"), "ABC123"),

    # Switzerland (CH)
    PlateRule("CH", "Switzerland", re.compile(r"^[A-Z]{2}[0-9]{1,6}$"), "ZH123456"),

    # Austria (AT)
    PlateRule("AT", "Austria", re.compile(r"^[A-Z]{1,2}[0-9]{1,5}[A-Z]{1,2}$"), "W12345A"),

    # Sweden (SE)
    PlateRule("SE", "Sweden", re.compile(r"^[A-Z]{3}[0-9]{2}[A-Z0-9]$"), "ABC12D"),

    # Norway (NO)
    PlateRule("NO", "Norway", re.compile(r"^[A-Z]{2}[0-9]{5}$"), "AB12345"),

    # Denmark (DK)
    PlateRule("DK", "Denmark", re.compile(r"^[A-Z]{2}[0-9]{5}$"), "AB12345"),

    # Poland (PL)
    PlateRule("PL", "Poland", re.compile(r"^[A-Z]{2,3}[A-Z0-9]{4,5}$"), "WA12345"),
]


def detect_country(plate: str) -> Tuple[Optional[str], Optional[str]]:
    """
    Detect country from license plate format.
    
    Args:
        plate: Raw or normalized license plate string
        
    Returns:
        Tuple of (country_code, country_name) or (None, None) if no match
    """
    plate_norm = normalize_plate(plate)
    
    if not plate_norm:
        return (None, None)
    
    for rule in PLATE_RULES:
        if rule.pattern.match(plate_norm):
            return (rule.country_code, rule.country_name)
    
    return (None, None)


def validate_license_plate(raw: str) -> Tuple[str, str, str]:
    """
    Validate and normalize a license plate.
    
    Args:
        raw: Raw license plate string
        
    Returns:
        Tuple of (normalized_plate, country_code, country_name)
        
    Raises:
        ValueError: If plate format is invalid for all supported countries
    """
    plate_norm = normalize_plate(raw)
    
    if not plate_norm:
        raise ValueError("License plate cannot be empty")
    
    # Check length bounds
    if len(plate_norm) < 4:
        raise ValueError("License plate is too short")
    if len(plate_norm) > 10:
        raise ValueError("License plate is too long")
    
    # Try to detect country
    code, name = detect_country(plate_norm)
    
    if code is None:
        examples = ", ".join(sorted({r.example for r in PLATE_RULES}))
        raise ValueError(
            f"Invalid license plate format. Supported formats (GB, IE, PT, ES, FR, DE, IT, NL, BE, CH, AT, SE, NO, DK, PL). Examples: {examples}"
        )
    
    return plate_norm, code, name


def is_valid_plate(plate: str) -> bool:
    """Simple boolean check if plate is valid for any supported country."""
    code, _ = detect_country(plate)
    return code is not None


def validate_plate_or_raise(raw: str) -> dict:
    """
    Validate plate and return details as dict.
    
    Args:
        raw: Raw license plate string
        
    Returns:
        dict with normalized_plate, detected_country_code, detected_country_name
        
    Raises:
        ValueError: If plate format is invalid
    """
    plate_norm, code, name = validate_license_plate(raw)
    return {
        "normalized_plate": plate_norm,
        "detected_country_code": code,
        "detected_country_name": name,
    }
