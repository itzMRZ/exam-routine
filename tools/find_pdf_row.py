#!/usr/bin/env python3
"""Cross-check a (course, section) row against the official PDF text."""
import sys

import pdfplumber

pdf_path = sys.argv[1]
target = sys.argv[2]
section = sys.argv[3]

with pdfplumber.open(pdf_path) as pdf:
    for page_number, page in enumerate(pdf.pages, start=1):
        for line in (page.extract_text() or "").splitlines():
            text = " ".join(line.split())
            if text.startswith(target) and f" {section} " in f" {text} ":
                print(f"page {page_number}: {text}")
