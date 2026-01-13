"""
Tests for license plate validation and country detection.
"""
import pytest
from app.core.plate_validation import (
    normalize_plate,
    detect_country,
    validate_license_plate,
    is_valid_plate,
    validate_plate_or_raise,
)


class TestNormalizePlate:
    """Tests for normalize_plate function"""
    
    def test_uppercase(self):
        assert normalize_plate("ab12cde") == "AB12CDE"
    
    def test_strip_whitespace(self):
        assert normalize_plate("  AB12CDE  ") == "AB12CDE"
    
    def test_remove_dashes(self):
        assert normalize_plate("AB-12-CDE") == "AB12CDE"
    
    def test_remove_spaces(self):
        assert normalize_plate("AB 12 CDE") == "AB12CDE"
    
    def test_remove_dots(self):
        assert normalize_plate("AB.12.CDE") == "AB12CDE"
    
    def test_mixed_separators(self):
        assert normalize_plate("AB-12 CDE") == "AB12CDE"
    
    def test_empty_string(self):
        assert normalize_plate("") == ""
    
    def test_none(self):
        assert normalize_plate(None) == ""


class TestDetectCountry:
    """Tests for detect_country function"""
    
    # Great Britain (GB)
    def test_gb_current_format(self):
        """GB current format: AB12CDE"""
        code, name = detect_country("AB12CDE")
        assert code == "GB"
        assert "Great Britain" in name
    
    def test_gb_with_spaces(self):
        """GB format with spaces: AB 12 CDE"""
        code, name = detect_country("AB 12 CDE")
        assert code == "GB"
    
    def test_gb_older_format(self):
        """GB older format: A123BCD"""
        code, name = detect_country("A123BCD")
        assert code == "GB"
    
    # Portugal (PT)
    def test_pt_new_format(self):
        """Portugal new format: AA12BB"""
        code, name = detect_country("AA12BB")
        assert code == "PT"
        assert "Portugal" in name
    
    def test_pt_old_format(self):
        """Portugal old format: 12AA34"""
        code, name = detect_country("12AA34")
        assert code == "PT"
    
    def test_pt_with_dashes(self):
        """Portugal format with dashes: 12-AA-34"""
        code, name = detect_country("12-AA-34")
        assert code == "PT"
    
    # France (FR)
    def test_fr_format(self):
        """France format: AA123AA"""
        code, name = detect_country("AA123AA")
        assert code == "FR"
        assert "France" in name
    
    def test_fr_with_dashes(self):
        """France format with dashes: AA-123-AA"""
        code, name = detect_country("AA-123-AA")
        assert code == "FR"
    
    # Spain (ES)
    def test_es_format(self):
        """Spain format: 1234ABC"""
        code, name = detect_country("1234ABC")
        assert code == "ES"
        assert "Spain" in name
    
    def test_es_with_spaces(self):
        """Spain format with spaces: 1234 ABC"""
        code, name = detect_country("1234 ABC")
        assert code == "ES"
    
    # Germany (DE)
    def test_de_format_simple(self):
        """Germany simple format: B1234"""
        code, name = detect_country("B1234")
        assert code == "DE"
        assert "Germany" in name
    
    def test_de_format_full(self):
        """Germany full format: BAB1234"""
        code, name = detect_country("BAB1234")
        assert code == "DE"
    
    def test_de_with_dashes(self):
        """Germany format with dashes: B-AB-1234"""
        code, name = detect_country("B-AB-1234")
        assert code == "DE"
    
    # Ireland (IE)
    def test_ie_format(self):
        """Ireland format: 12D12345"""
        code, name = detect_country("12D12345")
        assert code == "IE"
        assert "Ireland" in name
    
    # Italy (IT) - same format as France
    def test_it_format(self):
        """Italy format: AB123CD"""
        code, name = detect_country("AB123CD")
        # Note: France and Italy have same format, FR is checked first
        assert code in ("FR", "IT")
    
    # Netherlands (NL)
    def test_nl_format(self):
        """Netherlands format: AB12CD"""
        code, name = detect_country("AB12CD")
        # Note: Same as Portugal, PT checked first
        assert code in ("PT", "NL")
    
    # Belgium (BE)
    def test_be_format(self):
        """Belgium format: 1ABC123"""
        code, name = detect_country("1ABC123")
        assert code == "BE"
        assert "Belgium" in name
    
    # Invalid plates
    def test_invalid_too_short(self):
        """Invalid: too short"""
        code, name = detect_country("AB")
        assert code is None
    
    def test_invalid_no_match(self):
        """Invalid: doesn't match any pattern"""
        code, name = detect_country("12345678901234567890")
        assert code is None


class TestValidateLicensePlate:
    """Tests for validate_license_plate function"""
    
    def test_valid_gb_plate(self):
        """Valid GB plate returns normalized + country"""
        plate, code, name = validate_license_plate("AB12CDE")
        assert plate == "AB12CDE"
        assert code == "GB"
    
    def test_normalizes_input(self):
        """Input is normalized before validation"""
        plate, code, name = validate_license_plate("ab-12-cde")
        assert plate == "AB12CDE"
        assert code == "GB"
    
    def test_empty_raises(self):
        """Empty string raises ValueError"""
        with pytest.raises(ValueError, match="cannot be empty"):
            validate_license_plate("")
    
    def test_too_short_raises(self):
        """Too short raises ValueError"""
        with pytest.raises(ValueError, match="too short"):
            validate_license_plate("AB")
    
    def test_too_long_raises(self):
        """Too long raises ValueError"""
        with pytest.raises(ValueError, match="too long"):
            validate_license_plate("AB123456789012345")
    
    def test_invalid_format_raises(self):
        """Invalid format raises ValueError with examples"""
        with pytest.raises(ValueError, match="Invalid license plate format"):
            validate_license_plate("INVALID123456")


class TestIsValidPlate:
    """Tests for is_valid_plate function"""
    
    def test_valid_plate(self):
        assert is_valid_plate("AB12CDE") is True
    
    def test_invalid_plate(self):
        assert is_valid_plate("INVALID123456") is False
    
    def test_empty_plate(self):
        assert is_valid_plate("") is False


class TestValidatePlateOrRaise:
    """Tests for validate_plate_or_raise function"""
    
    def test_returns_dict(self):
        """Returns dict with expected keys"""
        result = validate_plate_or_raise("AB12CDE")
        assert isinstance(result, dict)
        assert "normalized_plate" in result
        assert "detected_country_code" in result
        assert "detected_country_name" in result
    
    def test_correct_values(self):
        """Returns correct values"""
        result = validate_plate_or_raise("ab-12-cde")
        assert result["normalized_plate"] == "AB12CDE"
        assert result["detected_country_code"] == "GB"
        assert "Great Britain" in result["detected_country_name"]
    
    def test_invalid_raises(self):
        """Invalid plate raises ValueError"""
        with pytest.raises(ValueError):
            validate_plate_or_raise("INVALID")


# Test examples from PRD
class TestPRDExamples:
    """Test the specific examples mentioned in the PRD"""
    
    def test_gb_ab12cde(self):
        """GB: AB12 CDE"""
        plate, code, _ = validate_license_plate("AB12 CDE")
        assert plate == "AB12CDE"
        assert code == "GB"
    
    def test_pt_12aa34(self):
        """PT: 12-AA-34"""
        plate, code, _ = validate_license_plate("12-AA-34")
        assert plate == "12AA34"
        assert code == "PT"
    
    def test_fr_aa123aa(self):
        """FR: AA-123-AA"""
        plate, code, _ = validate_license_plate("AA-123-AA")
        assert plate == "AA123AA"
        assert code == "FR"
    
    def test_es_1234abc(self):
        """ES: 1234 ABC"""
        plate, code, _ = validate_license_plate("1234 ABC")
        assert plate == "1234ABC"
        assert code == "ES"
    
    def test_de_bab1234(self):
        """DE: B-AB 1234"""
        plate, code, _ = validate_license_plate("B-AB 1234")
        assert plate == "BAB1234"
        assert code == "DE"
