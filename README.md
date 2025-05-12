# Exam Schedule Viewer

An application to view and organize your exam schedule for Spring-25.

## Features

- Add and track your courses and exam schedules
- Automatic sorting by date and time
- Take screenshots of your schedule
- Cross-check your exams with the original PDF schedule

## Setup

### Option 1: Open the index.html directly

You can open the `index.html` file directly in your browser. However, some browsers may block loading the PDF for cross-check functionality due to security restrictions.

### Option 2: Use a local server (recommended)

1. Option A: Run the provided test-server.bat file (Windows)
   - Double-click on test-server.bat
   - Open http://localhost:8000 in your browser

2. Option B: If you have Python installed
   - Open a terminal/command prompt in this directory
   - Run: `python -m http.server 8000`
   - Open http://localhost:8000 in your browser

3. Option C: If you have Node.js installed
   - Open a terminal in this directory
   - Run: `npx http-server -p 8000`
   - Open http://localhost:8000 in your browser

## Using the Cross-Check Feature

The improved cross-check feature now uses page numbers from the JSON data to directly display the correct PDF pages:

1. Add your courses using the input fields
2. Click the "Cross Check" button
3. A modal will appear showing the PDF pages that correspond to your exams
4. Each exam shows its corresponding page from the PDF document based on the "Page Number" field from the data
5. Use the modal to verify that your exam details match the official schedule

Note: The application will automatically find and display the correct pages for each course based on the page number stored in the data file, without needing to search through the PDF content.

## Troubleshooting

- If the cross-check feature doesn't work:
  - Make sure `examData.pdf` is in the root directory of the application
  - Try using a local server instead of opening the file directly
  - Check the browser console for any error messages
  - Make sure your browser supports PDF.js (most modern browsers do)
  - Check that the JSON data contains valid "Page Number" values for your courses

- If PDF pages aren't displaying correctly:
  - The PDF viewer will show the first few pages if a specific page number isn't found
  - Check that the course code and section are entered exactly as they appear in the data file
  - Try refreshing the page or clearing your browser cache
