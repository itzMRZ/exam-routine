#!/usr/bin/env python
"""
set_title.py

Utility to update the exam naming metadata inside `exam_data.json`.

Title logic follows: <Exam Name> <Semester>

Usage examples:
    python set_title.py "MidTerm Exam" "Fall-2025"
    python set_title.py "Final Exam" "Summer-2025" --file path/to/exam_data.json

This allows a single-place manual edit that the site will read and display.
"""
import argparse
import json
from datetime import datetime, timezone
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description='Set metadata exam name + semester in exam_data.json')
    parser.add_argument('exam_name', help='Exam name portion (e.g., "MidTerm Exam")')
    parser.add_argument('semester', help='Semester/term label (e.g., "Fall-2025")')
    parser.add_argument('--file', '-f', default='exam_data.json', help='Path to exam_data.json')
    args = parser.parse_args()

    path = Path(args.file)
    if not path.exists():
        print(f"Error: file not found: {path}")
        return

    try:
        data = json.loads(path.read_text(encoding='utf-8'))
    except Exception as e:
        print(f"Error reading JSON: {e}")
        return

    if 'metadata' not in data or not isinstance(data['metadata'], dict):
        data['metadata'] = {}

    exam_name = args.exam_name.strip()
    semester = args.semester.strip()
    combined_title = f"{exam_name} {semester}".strip()

    data['metadata']['exam_name'] = exam_name
    data['metadata']['semester'] = semester
    data['metadata']['title'] = combined_title  # legacy compatibility / screenshot naming
    data['metadata']['last_updated'] = datetime.now(timezone.utc).isoformat()

    try:
        path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding='utf-8')
        print(f"Updated {path} -> '{combined_title}'")
    except Exception as e:
        print(f"Error writing JSON: {e}")


if __name__ == '__main__':
    main()
