from __future__ import annotations

from datetime import datetime
from pathlib import Path

from weasyprint import HTML

_TEMPLATE_PATH = Path(__file__).resolve().parent.parent.parent / "openclaw" / "templates" / "formal_letter.html"


def generate_letter_pdf(
    target_name: str,
    target_address: str,
    initiator_name: str,
    body_html: str,
    grievance_ref: str,
    ref_number: str,
    level: int,
    max_level: int,
    start_date: str,
    attempt_count: int,
    channel_count: int,
    days_elapsed: int,
) -> bytes:
    """Render the formal letter template to a print-ready PDF."""
    template = _TEMPLATE_PATH.read_text()

    html = (
        template
        .replace("{{date}}", datetime.utcnow().strftime("%B %d, %Y"))
        .replace("{{target_name}}", target_name)
        .replace("{{target_address}}", target_address)
        .replace("{{initiator_name}}", initiator_name)
        .replace("{{body}}", body_html)
        .replace("{{grievance_ref}}", grievance_ref)
        .replace("{{ref_number}}", ref_number)
        .replace("{{level}}", str(level))
        .replace("{{max_level}}", str(max_level))
        .replace("{{start_date}}", start_date)
        .replace("{{attempt_count}}", str(attempt_count))
        .replace("{{channel_count}}", str(channel_count))
        .replace("{{days_elapsed}}", str(days_elapsed))
    )

    return HTML(string=html).write_pdf()
