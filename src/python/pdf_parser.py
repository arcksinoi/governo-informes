#!/usr/bin/env python3
"""
PDF Parser for CadUnico informes.
Extracts text, identifies operational calendar, and detects system status.

Usage:
    python pdf_parser.py <pdf_path>
    python pdf_parser.py test <pdf_path>

Output: JSON to stdout
"""

import sys
import json
import re
from datetime import datetime


def extract_text_from_pdf(filepath: str) -> str:
    """Extract text from PDF using pdfplumber (better layout) or PyPDF2 (fallback)."""
    text = ""

    # Try pdfplumber first (better for tables and complex layouts)
    try:
        import pdfplumber

        with pdfplumber.open(filepath) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n\n"

                # Also try to extract tables
                tables = page.extract_tables()
                for table in tables:
                    for row in table:
                        if row:
                            cells = [str(cell) if cell else "" for cell in row]
                            text += " | ".join(cells) + "\n"
                    text += "\n"

        if text.strip():
            return text.strip()
    except ImportError:
        pass
    except Exception as e:
        print(f"pdfplumber failed: {e}", file=sys.stderr)

    # Fallback to PyPDF2
    try:
        from PyPDF2 import PdfReader

        reader = PdfReader(filepath)
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n\n"
        return text.strip()
    except Exception as e:
        print(f"PyPDF2 failed: {e}", file=sys.stderr)
        return ""


def extract_operational_calendar(text: str) -> dict:
    """Extract operational calendar information from text."""
    result = {
        "has_calendar": False,
        "dates": [],
        "maintenance_windows": [],
        "system_downtime": [],
    }

    # Look for calendar-related sections
    calendar_patterns = [
        r"calend[aá]rio\s+operacional",
        r"cronograma\s+de\s+manuten[çc][ãa]o",
        r"previs[ãa]o\s+de\s+indisponibilidade",
        r"per[ií]odo\s+de\s+manuten[çc][ãa]o",
    ]

    for pattern in calendar_patterns:
        if re.search(pattern, text, re.IGNORECASE):
            result["has_calendar"] = True
            break

    # Extract dates
    date_patterns = [
        r"(\d{1,2}/\d{1,2}/\d{2,4})",
        r"(\d{1,2}\s+de\s+(?:janeiro|fevereiro|mar[çc]o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s+de\s+\d{4})",
    ]

    for pattern in date_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        result["dates"].extend(matches[:20])

    # Extract maintenance windows
    maint_pattern = r"(?:manuten[çc][ãa]o|indisponibilidade).*?(?:\d{1,2}/\d{1,2}/\d{2,4}.*?(?:at[eé]|a)\s*\d{1,2}/\d{1,2}/\d{2,4})"
    maint_matches = re.findall(maint_pattern, text, re.IGNORECASE)
    result["maintenance_windows"] = maint_matches[:10]

    return result


def detect_system_status(text: str) -> dict:
    """Detect system availability status from text."""
    systems = {
        "SIBEC": "unknown",
        "SICON": "unknown",
        "CECAD": "unknown",
        "SIGPBF": "unknown",
        "Cadastro Unico": "unknown",
        "V7": "unknown",
        "Sistema de Beneficios": "unknown",
    }

    text_lower = text.lower()

    downtime_keywords = [
        "indisponivel",
        "indisponibilidade",
        "fora do ar",
        "manutencao",
        "parada",
        "interrupcao",
        "suspensao",
        "suspenso",
        "inativo",
        "nao estara disponivel",
    ]

    active_keywords = [
        "disponivel",
        "funcionando",
        "operacional",
        "ativo",
        "normalizado",
        "restabelecido",
    ]

    for system in systems:
        sys_lower = system.lower()
        if sys_lower not in text_lower:
            continue

        # Check context around system mention (200 chars window)
        for match in re.finditer(re.escape(sys_lower), text_lower):
            start = max(0, match.start() - 100)
            end = min(len(text_lower), match.end() + 100)
            context = text_lower[start:end]

            for keyword in downtime_keywords:
                if keyword in context:
                    systems[system] = "inactive"
                    break

            if systems[system] == "unknown":
                for keyword in active_keywords:
                    if keyword in context:
                        systems[system] = "active"
                        break

    # Extract reason for downtime
    reason = None
    reason_patterns = [
        r"motivo[:\s]+(.+?)(?:\.|$)",
        r"devido [aà]\s+(.+?)(?:\.|$)",
        r"em raz[aã]o d[eao]\s+(.+?)(?:\.|$)",
    ]

    for pattern in reason_patterns:
        match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
        if match:
            reason = match.group(1).strip()[:200]
            break

    return {
        "systems": systems,
        "active": [s for s, status in systems.items() if status == "active"],
        "inactive": [s for s, status in systems.items() if status == "inactive"],
        "unknown": [s for s, status in systems.items() if status == "unknown"],
        "reason": reason,
        "has_downtime": any(status == "inactive" for status in systems.values()),
    }


def process_pdf(filepath: str) -> dict:
    """Full PDF processing pipeline."""
    text = extract_text_from_pdf(filepath)

    if not text:
        return {
            "success": False,
            "error": "Could not extract text from PDF",
            "filepath": filepath,
        }

    calendar = extract_operational_calendar(text)
    system_status = detect_system_status(text)

    return {
        "success": True,
        "filepath": filepath,
        "text": text,
        "text_length": len(text),
        "calendar": calendar,
        "system_status": system_status,
        "processed_at": datetime.now().isoformat(),
    }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python pdf_parser.py <pdf_path>", file=sys.stderr)
        sys.exit(1)

    mode = "parse"
    filepath = sys.argv[1]

    if sys.argv[1] == "test" and len(sys.argv) > 2:
        mode = "test"
        filepath = sys.argv[2]

    result = process_pdf(filepath)

    if mode == "test":
        print(f"\n=== PDF Parser Test: {filepath} ===\n")
        print(f"Success: {result.get('success')}")
        print(f"Text length: {result.get('text_length', 0)} chars")

        if result.get("calendar", {}).get("has_calendar"):
            print(f"\nCalendar found!")
            print(f"  Dates: {result['calendar']['dates'][:5]}")

        status = result.get("system_status", {})
        if status.get("has_downtime"):
            print(f"\nSystem downtime detected!")
            print(f"  Inactive: {status['inactive']}")
            print(f"  Reason: {status['reason']}")

        print(f"\nFirst 500 chars of text:")
        print(result.get("text", "")[:500])
    else:
        # Output JSON for Node.js to consume
        print(json.dumps(result, ensure_ascii=False))
