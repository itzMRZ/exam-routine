#!/usr/bin/env python3
"""Dump every PDF text line containing a token (debug helper)."""
import sys

import pdfplumber

pdf_path, token = sys.argv[1], sys.argv[2]
limit = int(sys.argv[3]) if len(sys.argv) > 3 else 15
shown = 0

with pdfplumber.open(pdf_path) as pdf:
    for page_number, page in enumerate(pdf.pages, start=1):
        for line in (page.extract_text() or "").splitlines():
            if token in line:
                print(f"p{page_number}: {line!r}")
                shown += 1
                if shown >= limit:
                    sys.exit()
print(f"({shown} lines shown)")
