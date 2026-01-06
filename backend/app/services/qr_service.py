import qrcode
import io
import base64
from typing import Tuple

from app.core.config import settings


def generate_qr_code(qr_token: str) -> Tuple[str, str]:
    """
    Generate QR code for a vehicle.
    Returns (qr_url, base64_encoded_png)
    """
    qr_url = f"{settings.QR_CODE_BASE_URL}/{qr_token}"
    
    # Generate QR code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=4,
    )
    qr.add_data(qr_url)
    qr.make(fit=True)
    
    # Create image
    img = qr.make_image(fill_color="#1a1d23", back_color="#f4f1ea")
    
    # Convert to base64
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    base64_data = base64.b64encode(buffer.getvalue()).decode("utf-8")
    
    return qr_url, f"data:image/png;base64,{base64_data}"
