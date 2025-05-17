/**
 * This file contains a fixed version of the table screenshot functionality WITHOUT cropping
 */

/**
 * Takes a screenshot of the schedule table without any cropping
 */
function takeScreenshot(options = {}) {
    // Default options for screenshot
    const defaultOptions = {
        cellPaddingTop: '5px',
        cellPaddingRight: '5px',
        cellPaddingBottom: '5px',
        cellPaddingLeft: '5px',
        headerPaddingTop: '5px',
        headerPaddingRight: '5px',
        headerPaddingBottom: '5px',
        headerPaddingLeft: '5px',
        scale: 3
    };

    // Merge default options with provided options
    const screenshotOptions = {...defaultOptions, ...options};

    // Check if table has content
    if (document.getElementById('schedule-body').children.length === 0) {
        showToast('No exams to screenshot. Please add courses first.', 'error');
        return;
    }

    // Show a notification that screenshot is being generated
    showToast('Creating screenshot...', 'info');    // Create a temporary container that includes only what we want in the screenshot
    const tempContainer = document.createElement('div');    tempContainer.className = 'bg-black p-6 rounded';
    // Set explicit width to match the original table's width
    const originalTable = document.querySelector('table');
    if (originalTable) {
        const originalWidth = originalTable.offsetWidth;
        tempContainer.style.width = originalWidth + 'px';
    }
    // Set overflow to visible to prevent cutting off content
    tempContainer.style.overflow = 'visible';
    tempContainer.style.marginBottom = '20px'; // Add extra margin at bottom

    // Add the title
    const title = document.createElement('h1');
    title.className = 'text-2xl font-bold mb-6 text-white text-center';
    title.textContent = document.querySelector('h1').textContent;
    tempContainer.appendChild(title);

    // Create a new table from scratch
    const newTable = document.createElement('table');
    newTable.className = 'min-w-full bg-black border border-white text-center';
    newTable.style.borderCollapse = 'collapse';
    newTable.style.width = '100%';
    newTable.style.border = '1px solid white';
    newTable.style.fontSize = '16px'; // Ensure consistent font size

    // Create table header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.style.borderBottom = '1px solid white';

    const headers = ['Date', 'Time', 'Course', 'Section', 'Classroom'];

    headers.forEach(text => {
        const th = document.createElement('th');
        th.className = 'px-3 py-3 text-center';
        th.style.color = 'white';

        // Create a div inside the header cell for flexbox centering
        const contentDiv = document.createElement('div');        contentDiv.style.display = 'flex';
        contentDiv.style.justifyContent = 'center';
        contentDiv.style.alignItems = 'center';
        contentDiv.style.minHeight = '30px'; // Ensure minimum height
        contentDiv.style.paddingTop = screenshotOptions.headerPaddingTop;
        contentDiv.style.paddingRight = screenshotOptions.headerPaddingRight;
        contentDiv.style.paddingBottom = screenshotOptions.headerPaddingBottom;
        contentDiv.style.paddingLeft = screenshotOptions.headerPaddingLeft;
        contentDiv.style.fontWeight = 'bold';
        contentDiv.style.color = 'white';
        contentDiv.textContent = text;

        th.appendChild(contentDiv);
        th.style.verticalAlign = 'middle';
        th.style.textAlign = 'center';

        headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    newTable.appendChild(thead);

    // Create table body with data from original table
    const tbody = document.createElement('tbody');
    const originalRows = document.getElementById('schedule-body').querySelectorAll('tr');

    originalRows.forEach(originalRow => {
        const newRow = document.createElement('tr');
        newRow.style.borderBottom = '1px solid white';

        Array.from(originalRow.cells).forEach(originalCell => {
            const cell = document.createElement('td');
            cell.className = 'px-3 py-3';
            cell.style.color = 'white';

            // Create a div inside the cell for flexbox centering
            const contentDiv = document.createElement('div');            contentDiv.style.display = 'flex';
            contentDiv.style.justifyContent = 'center';
            contentDiv.style.alignItems = 'center';
            contentDiv.style.minHeight = '30px'; // Ensure minimum height
            contentDiv.style.paddingTop = screenshotOptions.cellPaddingTop;
            contentDiv.style.paddingRight = screenshotOptions.cellPaddingRight;
            contentDiv.style.paddingBottom = screenshotOptions.cellPaddingBottom;
            contentDiv.style.paddingLeft = screenshotOptions.cellPaddingLeft;
            contentDiv.style.color = 'white';
            contentDiv.textContent = originalCell.textContent;

            cell.appendChild(contentDiv);
            cell.style.verticalAlign = 'middle';
            cell.style.textAlign = 'center';

            newRow.appendChild(cell);
        });

        tbody.appendChild(newRow);
    });

    newTable.appendChild(tbody);
    tempContainer.appendChild(newTable);

    // Temporarily add to document but hide it
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    document.body.appendChild(tempContainer);

    console.log('Starting screenshot capture...');

    // Check if html2canvas is available
    if (typeof html2canvas !== 'function') {
        console.error('html2canvas library not loaded');
        showToast('Screenshot failed - missing library. Please refresh the page and try again.', 'error');
        document.body.removeChild(tempContainer);
        return;
    }    // Take the screenshot    // Add a small delay before capturing to ensure everything has rendered properly
    setTimeout(() => {
        // Explicitly set the height to include a bit of extra space
        const computedHeight = tempContainer.scrollHeight + 20; // Add extra pixels at bottom

        html2canvas(tempContainer, {
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            logging: true,
            scale: screenshotOptions.scale, // Use configurable scale for quality control
            useCORS: true,
            allowTaint: true,
            width: tempContainer.offsetWidth,
            height: computedHeight, // Use computed height with extra padding
            windowHeight: computedHeight + 50, // Ensure window height is sufficient
            onclone: function(clonedDoc) {
                // Make sure the clone has visible overflow
                const clonedContainer = clonedDoc.body.querySelector('div');
                if (clonedContainer) {
                    clonedContainer.style.overflow = 'visible';
                    clonedContainer.style.paddingBottom = '20px';
                }
            }
        })
    }, 100).then(canvas => {
        console.log('Screenshot captured successfully');

        // No cropping is applied here - the table screenshot should not be cropped

        // Store the high-quality screenshot in a global variable for later use
        window.highQualityScreenshot = canvas.toDataURL('image/png');

        // Create download link
        const link = document.createElement('a');
        link.download = 'Spring25-Exam-Schedule.png';
        link.href = window.highQualityScreenshot;
        link.click();

        // Clean up
        document.body.removeChild(tempContainer);

        // Show success message
        showToast('Schedule screenshot saved!', 'success');
    }).catch(error => {
        console.error('Screenshot error:', error);
        showToast('Error taking screenshot. Please try again.', 'error');
        document.body.removeChild(tempContainer);
    });
}
