# BRAC University Exam Schedule Viewer

[![VibeCoded Social](https://img.shields.io/badge/VibeCoded-2E2E2E?style=social&logo=githubcopilot&logoColor=auto&labelColor=8000FF)](http://vibe-coding.urbanup.com/18529533)

A lightweight, interactive exam schedule viewer for BRAC University (BRACU). Built with vanilla HTML/CSS/JavaScript, no bloat.

## Live Demo

[bracu-exam-routine.itzmrz.xyz](https://bracu-exam-routine.itzmrz.xyz/)

## Features

- Quick course & section lookup with autocomplete
- Automatic sorting by date and start time
- Screenshot export for sharing
- PDF cross-check viewer
- Mobile-first responsive design
- Keyboard-friendly navigation

## Project Structure

```text
exam-routine/
├── index.html           # Main app
├── css/styles.css
├── js/
│   ├── data.js         # Data management
│   ├── ui.js           # UI components
│   ├── main.js         # Init
│   ├── dropdown.js     # Autocomplete
│   ├── pdf-*.js        # PDF handling
│   └── utils.js
├── convert_schedule.py  # Midterm: PDF → JSON
├── pdf_converter.py     # Finals: PDF → JSON (advanced)
├── set_title.py         # Update metadata
├── exam_data.json       # Database
├── examData.pdf
└── sitemap.xml, robots.txt
```

## Setup

### Option 1: Direct browser

Open `index.html` in your browser. (Some browsers may block PDF viewer due to CORS)

### Option 2: Local server (recommended)

```bash
# Python
python -m http.server 8000

# Node.js
npx http-server -p 8000

# PHP
php -S localhost:8000
```

Visit [http://localhost:8000](http://localhost:8000)

## Converting PDF Data


Fetch PDF:

```bash
python pdf_converter.py examData.pdf exam_data.json
```

Features:

- Multi-page extraction
- Auto header detection
- Date/time standardization
- Bounding box calculation
- Error handling

Update page title:

```bash
python set_title.py "Final Exam" "Fall-2025"
```

Updates metadata, title, and last updated timestamp. Refresh to see changes.

## Technical Stack

- **Frontend**: HTML5, TailwindCSS, Vanilla JS
- **Data Processing**: Python (pdfplumber)
- **Deployment**: Static hosting (Vercel, GitHub Pages, etc.)
- **Analytics**: Plausible Analytics, Vercel Web Analytics
- **PDF**: PDF.js + html2canvas

## Python dependencies

This repository uses Python for PDF → JSON conversion. The only runtime dependency required by the scripts in the repository is:

- `pdfplumber`

Install dependencies with pip. If `pip` is missing on your system, bootstrap it first and upgrade pip:

```bash
# Ensure pip is available and up-to-date
python -m ensurepip --upgrade
python -m pip install --upgrade pip

# Install project dependencies
python -m pip install -r requirements.txt
```

On Windows you can run the provided `install_deps.bat` script:

```powershell
./install_deps.bat
```

If you want, I can run the installer now in your environment.

## Recent Changes

- Cleaned up codebase
- Consolidated CSS
- Optimized JavaScript
- Added SEO metadata (see `index.html` for details)
