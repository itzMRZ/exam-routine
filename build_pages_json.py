#!/usr/bin/env python3
"""Build exam_pages.json from exam_data.json — PDF page mapping for the cross-check viewer.

Output is a separate, lean JSON that the site loads only when it is serving the
official PDF-derived schedule, so the CDN exams.json schema stays untouched.
Keys are normalized as COURSE|SECTION (plain-digit sections zero-padded to 2).
"""
import json
import re
import sys
from datetime import datetime


def section_key(section):
    text = str(section or "").strip()
    return text.zfill(2) if re.fullmatch(r"\d+", text) else text


def page_key(course, section):
    return f"{str(course).strip().upper()}|{section_key(section)}"


def main(exam_data_path, out_path):
    with open(exam_data_path, encoding="utf-8") as f:
        data = json.load(f)

    exams = data.get("exams", [])
    metadata = data.get("metadata", {})

    pages = {}
    for exam in exams:
        course = exam.get("Course")
        section = exam.get("Section")
        page_number = exam.get("Page Number")
        if not course or section is None or not page_number:
            continue
        pages[page_key(course, section)] = {
            "pageNumber": page_number,
            "boundingBox": exam.get("BoundingBox"),
        }

    output = {
        "metadata": {
            "source": metadata.get("source"),
            "exam_name": metadata.get("exam_name"),
            "semester": metadata.get("semester"),
            "generated_at": datetime.now().isoformat(),
            "totalEntries": len(pages),
        },
        "pages": pages,
    }

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    print(f"Wrote {len(pages)} page mappings to {out_path}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python build_pages_json.py exam_data.json exam_pages.json")
        sys.exit(1)
    main(sys.argv[1], sys.argv[2])
