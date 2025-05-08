import sys
import json
import re
from datetime import datetime
import pdfplumber

def clean_text(text):
    """Clean text by removing extra whitespace"""
    if text is None:
        return None
    return re.sub(r'\s+', ' ', text).strip()

def standardize_date(date_str):
    """Standardize date format to ISO (YYYY-MM-DD)"""
    if not date_str or not isinstance(date_str, str):
        return date_str

    try:
        # For format like "20-Mar-25"
        dt = datetime.strptime(date_str.strip(), "%d-%b-%y")
        return dt.strftime("%Y-%m-%d")
    except ValueError:
        return date_str

def standardize_time(time_str):
    """Standardize time format to 24-hour (HH:MM)"""
    if not time_str or not isinstance(time_str, str):
        return time_str

    try:
        # For format like "12:00 PM"
        dt = datetime.strptime(time_str.strip(), "%I:%M %p")
        return dt.strftime("%H:%M")
    except ValueError:
        return time_str

def is_valid_entry(entry):
    """Check if an entry has the minimum required fields to be considered valid"""
    required_fields = ["Course", "Section", "Final Date"]
    return all(field in entry and entry[field] for field in required_fields)

def is_header_row(row, headers):
    """Check if a row is likely a header row"""
    if not row:
        return False
    # Check if the row contains typical header text
    header_texts = ['course', 'section', 'date', 'time', 'room', 'dept']
    row_text = ' '.join(str(cell).lower() for cell in row if cell)
    return any(text in row_text for text in header_texts)

def convert_pdf_to_json(pdf_path, json_path):
    print(f"Processing {pdf_path}...")

    # Store all entries here
    all_entries = []

    # Store the headers from the first page to use for all pages
    global_headers = []

    with pdfplumber.open(pdf_path) as pdf:
        print(f"PDF contains {len(pdf.pages)} pages")

        # First pass: Get headers from first page
        first_page = pdf.pages[0]
        tables = first_page.extract_tables()

        if tables and len(tables) > 0 and len(tables[0]) > 0:
            # Get headers from the first table on the first page
            headers = [clean_text(cell) if cell else "" for cell in tables[0][0]]

            # Normalize headers
            for header in headers:
                if not header:
                    global_headers.append("")
                    continue

                if "course" in header.lower():
                    global_headers.append("Course")
                elif "section" in header.lower() or "sec" in header.lower():
                    global_headers.append("Section")
                elif "date" in header.lower():
                    global_headers.append("Final Date")
                elif "start" in header.lower() or "from" in header.lower():
                    global_headers.append("Start Time")
                elif "end" in header.lower() or "to" in header.lower():
                    global_headers.append("End Time")
                elif "room" in header.lower():
                    global_headers.append("Room.")
                elif "dept" in header.lower():
                    global_headers.append("Dept.")
                elif "sl" in header.lower() or "serial" in header.lower() or "#" in header:
                    global_headers.append("SL.")
                else:
                    global_headers.append(header)

            print(f"Extracted global headers: {global_headers}")
        else:
            print("Warning: Could not extract headers from first page!")
            # Fallback default headers
            global_headers = ["Course", "Section", "Final Date", "Start Time", "End Time", "Room.", "Dept."]

        # Second pass: Process all pages using the global headers
        for page_num, page in enumerate(pdf.pages, 1):
            print(f"Processing page {page_num}...")

            # Extract tables from the current page
            tables = page.extract_tables()

            if tables:
                print(f"  Found {len(tables)} tables on page {page_num}")

                for table_idx, table in enumerate(tables):
                    if not table:
                        continue

                    # Skip header row on every page
                    for row in table[1:]:  # Always skip first row
                        if not row or all(cell is None or (isinstance(cell, str) and cell.strip() == "") for cell in row):
                            continue

                        # Skip if this looks like another header row
                        if is_header_row(row, global_headers):
                            continue

                        entry = {}
                        for i, cell in enumerate(row):
                            if i < len(global_headers) and cell and global_headers[i]:
                                value = clean_text(cell)
                                if value:
                                    entry[global_headers[i]] = value

                        # Standardize date and time fields
                        if "Final Date" in entry:
                            entry["Final Date"] = standardize_date(entry["Final Date"])

                        if "Start Time" in entry:
                            entry["Start Time"] = standardize_time(entry["Start Time"])

                        if "End Time" in entry:
                            entry["End Time"] = standardize_time(entry["End Time"])

                        # Only include valid entries and skip header rows that might have been picked up
                        if is_valid_entry(entry) and entry.get("Course") != "Course":
                            all_entries.append(entry)
                            print(f"    Added entry: Course={entry.get('Course')}, Section={entry.get('Section')}")
                        else:
                            missing = [field for field in ["Course", "Section", "Final Date"] if field not in entry or not entry[field]]
                            print(f"    Skipping invalid entry, missing: {missing}")
            else:
                print(f"  No tables found on page {page_num}")

    print(f"Total valid entries extracted: {len(all_entries)}")

    # Create final output with metadata
    output = {
        "metadata": {
            "source": pdf_path,
            "generated_at": datetime.now().isoformat(),
            "total_entries": len(all_entries),
            "fields_description": {
                "Course": "Course code",
                "Section": "Class section number",
                "Final Date": "Examination date (YYYY-MM-DD)",
                "Start Time": "Exam start time (24-hour format)",
                "End Time": "Exam end time (24-hour format)",
                "Room.": "Examination room",
                "Dept.": "Department offering the course"
            }
        },
        "exams": all_entries
    }

    # Write the data to a JSON file
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"Converted PDF data has been written to {json_path}")

if __name__ == "__main__":
    # Check for proper command-line arguments
    if len(sys.argv) < 3:
        print("Usage: python convert_schedule_final.py input.pdf output.json")
        sys.exit(1)

    pdf_path = sys.argv[1]
    json_path = sys.argv[2]
    convert_pdf_to_json(pdf_path, json_path)