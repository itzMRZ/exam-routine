# BRACU Exam Routine Application - Developer Documentation

## Table of Contents
1. [Overview](#overview)
2. [Project Structure](#project-structure)
3. [Key Components](#key-components)
4. [PDF Processing](#pdf-processing)
5. [User Interface](#user-interface)
6. [Data Handling](#data-handling)
7. [Features Implementation](#features-implementation)
8. [Cross-Check Functionality](#cross-check-functionality)
9. [Customization Guide](#customization-guide)
10. [Troubleshooting](#troubleshooting)

## Overview

This web application allows BRAC University students to create a personalized exam routine by selecting their courses and sections. The app extracts relevant exam information from the official PDF schedule and presents it in a user-friendly format. Key features include:

- Course and section selection
- Interactive table generation
- Screenshot functionality
- PDF cross-check verification with highlighted sections
- Mobile-friendly responsive design

## Project Structure

```
exam-routine/
├── index.html              # Main HTML file
├── css/
│   └── styles.css          # Main stylesheet
├── js/
│   ├── data.js             # Course data and cache management
│   ├── dropdown.js         # Custom dropdown functionality
│   ├── main.js             # Application initialization
│   ├── pdf-debug.js        # Debug tools for PDF processing
│   ├── pdf-helper.js       # PDF rendering and processing
│   ├── pdf-screenshot-helper.js # PDF screenshot and cropping utilities
│   ├── pdf-viewer.js       # PDF display functionality
│   ├── ui.js               # UI management (toasts, interactions)
│   └── utils.js            # Utility functions
├── convert_schedule.py     # Python script to convert PDF to JSON
├── converterV2.py          # newer PDF conversion script
├── exam_data.json          # Processed exam data
├── examData.pdf            # Source PDF file
└── README.md               # General readme file
```

## Key Components

### Core JavaScript Files

1. **main.js**: Entry point of the application that initializes all components.
2. **data.js**: Manages course data, sections, and caching mechanisms.
3. **ui.js**: Handles all user interface interactions, toast notifications, and dynamic content generation.
4. **pdf-helper.js**: Core PDF processing functionality for rendering and highlighting.
5. **pdf-screenshot-helper.js**: Manages screenshot capturing and PDF cropping.

### External Libraries

- **PDF.js**: Used for rendering and manipulating PDF files in the browser.
- **TailwindCSS**: Utility-first CSS framework for styling.
- **html2canvas**: For capturing screenshots of HTML elements.
- **FontAwesome**: For icons throughout the interface.

## PDF Processing

### PDF Rendering (pdf-helper.js)

The application uses PDF.js to render and process PDF documents. Key functions:

- `fetchPdfDocument()`: Fetches the PDF from the server.
- `renderExamPage(page, canvas, searchText)`: Renders a PDF page to canvas with highlighting.
- `findTextInPage(page, searchText)`: Locates specific text on a PDF page.
- `highlightFoundText(canvas, textItems)`: Adds highlighting to found text.

### PDF Screenshot Processing (pdf-screenshot-helper.js)

Functions for processing PDF screenshots and crops:

- `cropPdfScreenshot(canvasData, cropPercentages)`: Crops PDF canvas based on percentage values.
- `cropImageFromUrl(imageUrl)`: Creates a cropped version of an image from URL.

### Highlighting Implementation

Text highlighting in the PDF uses semi-transparent red rectangles:

1. Text is first located using PDF.js text extraction.
2. Rectangles are drawn using Canvas API with:
   - Fill style: `rgba(255, 0, 0, 0.25)` (semi-transparent red)
   - Expanded width: 4% wider than the actual text (2% on each side)

### Cropping Implementation

PDF screenshots in the cross-check functionality are cropped asymmetrically:
- 9% from left and right sides
- 2% from top and bottom

```javascript
// Cropping is applied after highlighting, ONLY for cross-check PDF screenshots
const cropPercentages = {
    left: 9,
    right: 9,
    top: 2,
    bottom: 2
};
```

**Note:** The regular table screenshot functionality should NOT apply any cropping. This cropping is specifically for the cross-check PDF screenshots to focus on the relevant exam information.

## User Interface

### Key UI Elements

1. **Course Input Fields**: Dynamic input fields for course codes and sections.
2. **Schedule Table**: Displays the generated exam schedule.
3. **Action Buttons**: "Screenshot" and "Cross Check" buttons.
4. **Cross Check Modal**: PDF viewer for verification with highlighted sections.
5. **Toast Notifications**: Feedback messages for user actions.

### UI Customization (ui.js)

The UI is built dynamically using JavaScript. Key functions:

- `initUI()`: Initializes all UI components and event listeners.
- `showToast(message, type)`: Displays toast notifications.
- `addScheduleRow(data)`: Adds a row to the schedule table.
- `updateStatusMessage(message)`: Updates status messages.

### Mobile Responsiveness

The application is designed to be responsive on various devices:

- Uses Flexbox and responsive units for layout
- Applies specific optimizations for small screens via media queries
- Ensures touch-friendly button sizes (min 44px height) on mobile
- Implements horizontal scrolling for tables on small screens

## Data Handling

### Data Structure

Exam data is stored in JSON format:

```javascript
{
  "courseCode": {
    "sectionName": {
      "date": "YYYY-MM-DD",
      "time": "HH:MM AM/PM",
      "room": "Room Name",
      "pdfPageIndex": 0  // Index of page in PDF
    }
  }
}
```

### Data Flow

1. PDF is converted to JSON using Python scripts (convert_schedule.py or converterV2.py).
2. JSON data is loaded at runtime.
3. When a user selects courses, relevant data is filtered and displayed.

## Features Implementation

### Course Selection

Course selection uses a custom autocomplete/dropdown:

- Input fields monitor user input for matching course codes
- Custom dropdown shows available options
- Section numbers are validated against available sections

### Schedule Generation

The schedule table is populated based on selected courses:

1. Event listeners on "Add" buttons capture input values
2. Course data is validated against the main data source
3. Valid entries are added to the schedule table
4. Duplicate entries are rejected with a toast notification

### Screenshot Functionality

The application has two separate screenshot features:

1. **Table Screenshot**: Takes a screenshot of the exam schedule table without any cropping
   - Uses the html2canvas library to capture the table
   - The file is downloaded as "Spring25-Exam-Schedule.png"

2. **Cross-Check PDF Screenshots**: Shows PDF screenshots with highlighting and cropping
   - Applies 9% cropping from sides, 2% from top/bottom
   - Uses semi-transparent red highlighting
   - Shows the relevant exam details on the original PDF

#### Screenshot Implementation Details

The table screenshot functionality works as follows:

1. `takeScreenshot(options)` creates a temporary container with styled content
   - Takes an optional options object with configurable settings:   - `cellPaddingTop`, `cellPaddingRight`, `cellPaddingBottom`, `cellPaddingLeft`: Controls individual paddings for table cells (default: '5px')
   - `headerPaddingTop`, `headerPaddingRight`, `headerPaddingBottom`, `headerPaddingLeft`: Controls individual paddings for table headers (default: '5px')
   - `scale`: Controls the screenshot quality (default: 3)
2. The container width is set to match the original table width to prevent scaling issues
3. The container has `overflow: visible` and extra margin to prevent content from being cut off
4. Cell padding is applied according to configurable settings
5. `html2canvas()` captures this container with scale set to 3 for high-quality screenshots
6. A slight delay (100ms) is added before capture to ensure proper rendering
7. The container height is explicitly set with extra padding to prevent bottom rows from being cut off
8. No cropping is applied to the table screenshot (important!)
9. A download link is created with the screenshot data
10. The file is automatically downloaded as "Spring25-Exam-Schedule.png"

The PDF cross-check functionality works differently:

1. PDF pages are rendered with transparent red highlighting
2. The highlighted pages are cropped (9% sides, 2% top/bottom)
3. The cropped screenshots are displayed in a modal for verification

Both features include robust error handling and user feedback via toast notifications.

#### Screenshot Configuration Options

The screenshot functionality now accepts configuration options:

```javascript
takeScreenshot({
    // Cell padding for each side independently
    cellPaddingTop: '5px',
    cellPaddingRight: '5px',
    cellPaddingBottom: '5px',
    cellPaddingLeft: '5px',

    // Header padding for each side independently
    headerPaddingTop: '5px',
    headerPaddingRight: '5px',
    headerPaddingBottom: '5px',
    headerPaddingLeft: '5px',

    scale: 3               // Controls screenshot quality (1-4)
});
```

**Cell Padding Adjustment**:
- You can customize padding for all four sides independently:
  - Top, right, bottom, and left sides for both headers and cells
- Values are specified in CSS units (pixels recommended)
- These settings affect the visual spacing in the final screenshot
- Adjust individual sides to improve readability or create custom layouts
- Fine-tune vertical spacing by adjusting top/bottom padding separately
- Control horizontal alignment by adjusting left/right padding

**Screenshot Scale/Quality**:
- Scale affects the resolution of the captured image
- Higher values (3-4) produce sharper images for printing or zooming
- Lower values (1-2) produce smaller file sizes and faster processing
- Default value is 3 for a good balance of quality and performance

**Test Environment**:
- Use test-screenshot.html to experiment with different settings
- Features UI sliders to adjust padding for all sides individually:
  - Separate controls for top, right, bottom, and left padding
  - Independent settings for header and data cells
- Includes scale slider to control output quality (1-4x)
- Real-time preview shows how padding changes will affect screenshot
- All settings are applied immediately when taking a screenshot

## Cross-Check Functionality

The cross-check feature allows users to verify their schedule against the original PDF:

### Implementation Details

1. **Initialization**:
   ```javascript
   document.getElementById('cross-check-btn').addEventListener('click', showCrossCheckModal);
   ```

2. **PDF Processing Flow**:
   1. Modal is displayed with loading indicator
   2. PDF is fetched and loaded using PDF.js
   3. For each course in the schedule:
      - The corresponding PDF page is located
      - Text matching the course/section is found
      - Highlighting is applied to the found text
      - Canvas is rendered with highlighting
   4. Cropping is applied to focus on relevant areas (9% from sides, 2% from top/bottom)
   5. Rendered pages are displayed in the modal

3. **Key Functions**:
   - `showCrossCheckModal()`: Opens the modal and initiates PDF processing
   - `renderExamPage()`: Renders a PDF page with highlighting
   - `cropPdfScreenshot()`: Crops the rendered canvas

### Highlighting Process

1. Text is located using PDF.js text extraction
2. Canvas context is set to semi-transparent red: `rgba(255, 0, 0, 0.25)`
3. Extra width is added to highlight: `extraWidth = highlightWidth * 0.04`
4. Rectangle is drawn around found text
5. Cropping is applied to the final canvas

## Customization Guide

### Changing the PDF Source

To update the source PDF for a new semester:

1. Replace `examData.pdf` with the new file (keep the same name)
2. Run the conversion script: `python converterV2.py`
3. Verify the generated `exam_data.json` has correct data
4. Update the title in `index.html` to reflect the new semester

### Modifying the UI

To change the UI appearance:

1. **Colors**: Update background colors and text colors in `index.html` and `styles.css`
2. **Layout**: Modify the flex containers and grid layouts in HTML
3. **Responsive Breakpoints**: Adjust media queries in the CSS section

### Adjusting PDF Processing

To modify PDF highlighting or cropping:

1. **Highlight Color**: Change the `fillStyle` in `pdf-helper.js`
   ```javascript
   context.fillStyle = 'rgba(255, 0, 0, 0.25)'; // Change to desired color/opacity
   ```

2. **Highlight Width**: Adjust the expansion factor
   ```javascript
   const extraWidth = highlightWidth * 0.04; // Change the multiplier as needed
   ```

3. **Cropping Percentages**: Update values in `pdf-screenshot-helper.js`
   ```javascript
   const cropPercentages = {
       left: 9,     // Adjust as needed
       right: 9,    // Adjust as needed
       top: 2,      // Adjust as needed
       bottom: 2    // Adjust as needed
   };
   ```

## Troubleshooting

### Common Issues

1. **PDF Not Rendering**:
   - Check console for PDF.js errors
   - Verify PDF.js worker is properly loaded
   - Ensure PDF file path is correct

2. **Course Data Not Loading**:
   - Check browser console for JSON parsing errors
   - Verify `exam_data.json` exists and is properly formatted

3. **Highlighting Not Working**:
   - Ensure text search terms match exactly what's in the PDF
   - Check if PDF text extraction is working correctly
   - Try adjusting the search algorithm in `findTextInPage()`

4. **Screenshot Functionality Not Working**:
   - Verify html2canvas library is properly loaded in the browser console
   - Check if PDF_SCREENSHOT_HELPER_LOADED is true in the console
   - Look for error messages about cropping or canvas manipulation
   - Try disabling browser extensions that might interfere with canvas operations
   - Check if the browser supports canvas operations and downloading files

5. **Responsive Layout Issues**:
   - Test with different viewport sizes in browser dev tools
   - Verify media queries are correctly applied
   - Check for overflow issues in flexbox containers

### Screenshot Troubleshooting

If you encounter issues with screenshots:

1. **Bottom Row Cutting Off**:
   - The application has been fixed to prevent bottom row cutting by:
     - Setting explicit container overflow to visible
     - Adding extra margin and padding at the bottom
     - Using configurable padding for all cells
     - Setting explicit container height with extra space
     - Adding a rendering delay before capture
     - Using the onclone callback to ensure proper styling

2. **Screenshot Quality and Zoom Issues**:
   - `scale: 3` is set by default in html2canvas options for high-quality output
   - Can be configured with the `scale` option in the takeScreenshot function
   - Set explicit width on the container to match the original table
   - Test-screenshot.html has UI controls to adjust scale between 1-4x

3. **Missing Elements in Screenshots**:
   - Check that all elements have explicit colors set (especially text)
   - Ensure container is properly attached to the document before capture

4. **Testing Screenshots**:
   - Use the test-screenshot.html file to test in isolation
   - Compare with the PDF cross-check functionality
   - Verify both features function with different screen sizes

### Debugging Tools

- Use `pdf-debug.js` for debugging PDF processing issues
- Add `console.log()` statements to trace data flow
- Monitor network requests to ensure PDF and JSON files are loading
- Test PDF text extraction with `page.getTextContent()` in browser console

## Future Enhancements

Potential areas for future development:

1. **Conflict Detection**: Warning for overlapping exam times
2. **Dark/Light Mode Toggle**: Support for different color schemes
3. **User Preferences**: Save and restore course selections

---

This documentation was created on May 17, 2025. Please update as necessary when making significant changes to the codebase.
