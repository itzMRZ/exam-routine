# Exam Schedule Viewer

[![VibeCoded Social](https://img.shields.io/badge/VibeCoded-2E2E2E?style=social&logo=githubcopilot&logoColor=auto&labelColor=8000FF)](http://vibe-coding.urbanup.com/18529533)

A clean, modern web application to view and organize your exam schedule for Summer-2025 Finals.

## Features

- Add and track your courses and exam schedules
- Automatic sorting by date and time
- Take screenshots of your schedule
- Cross-check your exams with the original PDF schedule
- Mobile-responsive design
- Clean, optimized codebase

## Project Structure

```text
exam-routine/
├── index.html              # Main HTML file
├── css/
│   └── styles.css          # All CSS styles (consolidated)
├── js/
│   ├── data.js             # Course data management
│   ├── dropdown.js         # Dropdown functionality
│   ├── main.js             # Application initialization
│   ├── pdf-helper.js       # PDF rendering and processing
│   ├── pdf-screenshot-helper.js # PDF screenshot utilities
│   ├── pdf-viewer.js       # PDF display functionality
│   ├── ui.js               # UI management and interactions
│   └── utils.js            # Utility functions
├── convert_schedule.py     # PDF to JSON converter (midterms)
├── pdf_converter.py        # Advanced PDF converter (finals)
├── exam_data.json          # Processed exam data
├── examData.pdf            # Source PDF file
└── README.md               # This file
```

## Setup

### Option 1: Open the index.html directly

You can open the `index.html` file directly in your browser. However, some browsers may block loading the PDF for cross-check functionality due to security restrictions.

### Option 2: Use a local server (recommended)

1. **Python**: `python -m http.server 8000`
2. **Node.js**: `npx http-server -p 8000`
3. **PHP**: `php -S localhost:8000`

Then open <http://localhost:8000> in your browser.

## Converting PDF Data

To update the exam data from a new PDF:

```bash
# For midterm schedules
python convert_schedule.py examData.pdf exam_data.json

# For final schedules (recommended - more advanced)
python pdf_converter.py examData.pdf exam_data.json
```

## Recent Improvements

- **Cleaned up codebase**: Removed duplicate and unnecessary files
- **Consolidated CSS**: All styles moved to single CSS file
- **Optimized JavaScript**: Removed redundant functionality
- **Better file organization**: Clear structure and naming
- **Mobile optimized**: Enhanced responsive design
- **Performance improvements**: Faster loading and better user experience
