// ui.js - UI interaction functions

/**
 * Shows a toast notification
 * @param {string} message - The message to display
 * @param {string} type - Type of toast (success, error, info)
 */
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    // Add to container
    const container = document.getElementById('toast-container');
    container.appendChild(toast);

    // Remove after animation
    toast.addEventListener('animationend', (e) => {
        if (e.animationName === 'fadeOut') {
            container.removeChild(toast);
        }
    });
}

/**
 * Updates the title based on exam type
 * @param {boolean} isFinalsSchedule - Whether it's finals or midterms
 */
function updateTitle(isFinalsSchedule) {
    const examType = isFinalsSchedule ? "FINAL" : "MIDTERM";
    document.querySelector('h1').textContent = `SPRING-25 ${examType} SCHEDULE`;
    document.title = `Spring-25 ${examType} Schedule`;
}

/**
 * Adds exams to the schedule table
 * @param {Array} exams - Array of exam objects to add
 */
function addExamsToSchedule(exams) {
    if (!exams || exams.length === 0) return;

    const scheduleBody = document.getElementById('schedule-body');
    if (!scheduleBody) {
        console.error("Could not find schedule-body element!");
        return;
    }

    // Add each exam to the table
    exams.forEach(exam => {
        // Check if this exam is already in the table to avoid duplicates
        const existingRows = Array.from(scheduleBody.querySelectorAll('tr')).filter(row => {
            return row.cells[2].textContent === exam.courseCode &&
                   row.cells[3].textContent === exam.section;
        });

        if (existingRows.length === 0) {
            const row = document.createElement('tr');
            row.className = 'border-b border-white hover:bg-blue-800 transition';

            // Create row cells
            row.innerHTML = `
                <td class="px-3 py-3 align-middle">${exam.date}</td>
                <td class="px-3 py-3 align-middle">${exam.time}</td>
                <td class="px-3 py-3 align-middle">${exam.courseCode}</td>
                <td class="px-3 py-3 align-middle">${exam.section}</td>
                <td class="px-3 py-3 align-middle">${exam.classroom}</td>
            `;

            scheduleBody.appendChild(row);

            // Sort the table after adding new entry
            sortScheduleTable();
        }
    });
}

/**
 * Sorts the schedule table by date and time
 */
function sortScheduleTable() {
    const scheduleBody = document.getElementById('schedule-body');
    if (!scheduleBody) return;

    const rows = Array.from(scheduleBody.querySelectorAll('tr'));
    if (rows.length <= 1) return;

    // Sort rows
    rows.sort((a, b) => {
        const dateA = a.cells[0].textContent;
        const dateB = b.cells[0].textContent;
        const dateCompare = new Date(utils.convertDate(dateA)) - new Date(utils.convertDate(dateB));

        if (dateCompare !== 0) return dateCompare;

        // If same date, compare times
        const timeA = a.cells[1].textContent.split(' - ')[0];
        const timeB = b.cells[1].textContent.split(' - ')[0];
        return utils.convertTimeToMinutes(timeA) - utils.convertTimeToMinutes(timeB);
    });

    // Clear and reappend sorted rows
    while (scheduleBody.firstChild) {
        scheduleBody.removeChild(scheduleBody.firstChild);
    }

    // Reappend sorted rows
    rows.forEach(row => scheduleBody.appendChild(row));
}

/**
 * Takes a screenshot of the schedule table
 */
function takeScreenshot() {
    // Check if table has content
    if (document.getElementById('schedule-body').children.length === 0) {
        showToast('No exams to screenshot. Please add courses first.', 'error');
        return;
    }

    // Create a temporary container that includes only what we want in the screenshot
    const tempContainer = document.createElement('div');
    tempContainer.className = 'bg-black p-6 rounded';

    // Add the title
    const title = document.createElement('h1');
    title.className = 'text-2xl font-bold mb-6 text-white text-center';
    title.textContent = document.querySelector('h1').textContent;
    tempContainer.appendChild(title);

    // Create a new table from scratch
    const newTable = document.createElement('table');
    newTable.className = 'min-w-full bg-opacity-70 bg-black border border-white text-center';
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

        // Create a div inside the header cell for flexbox centering
        const contentDiv = document.createElement('div');
        contentDiv.style.display = 'flex';
        contentDiv.style.justifyContent = 'center';
        contentDiv.style.alignItems = 'center';
        contentDiv.style.minHeight = '30px'; // Ensure minimum height
        contentDiv.style.padding = '0rem 0 0.9rem 0'; // Less padding on top, more on bottom
        contentDiv.style.fontWeight = 'bold';
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

            // Create a div inside the cell for flexbox centering
            const contentDiv = document.createElement('div');
            contentDiv.style.display = 'flex';
            contentDiv.style.justifyContent = 'center';
            contentDiv.style.alignItems = 'center';
            contentDiv.style.minHeight = '30px'; // Ensure minimum height
            contentDiv.style.padding = '0rem 0 0.9rem 0'; // Less padding on top, more on bottom
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
    document.body.appendChild(tempContainer);    // Take high-quality screenshot of the temporary element
    html2canvas(tempContainer, {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        logging: false,
        scale: 4, // Higher resolution for better quality
        useCORS: true,
        allowTaint: true
    }).then(canvas => {
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

/**
 * Opens a modal with the high-quality screenshot
 * @param {string} imageUrl - URL of the high-quality screenshot
 */
function openScreenshotModal(imageUrl) {
    // Create or get modal container
    let modal = document.getElementById('screenshot-fullscreen-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'screenshot-fullscreen-modal';
        modal.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.95);z-index:2000;display:flex;flex-direction:column;align-items:center;justify-content:center;';
        document.body.appendChild(modal);
    } else {
        modal.style.display = 'flex';
    }

    // Clear previous content
    modal.innerHTML = '';

    // Create container for the image with improved spacing
    const imgContainer = document.createElement('div');
    imgContainer.style.cssText = 'position:relative;width:85%;height:85%;display:flex;align-items:center;justify-content:center;overflow:hidden;padding:10px;border:2px solid rgba(255,255,255,0.15);border-radius:12px;background:rgba(0,0,0,0.3);';

    // Create the image element
    const img = document.createElement('img');
    img.id = 'screenshot-fullscreen-img';
    img.src = imageUrl;
    img.alt = 'Full Screen Schedule';
    img.style.cssText = 'max-width:100%;max-height:100%;object-fit:contain;transform-origin:center;';

    // Add controls for zoom
    const controlsContainer = document.createElement('div');
    controlsContainer.style.cssText = 'position:absolute;bottom:20px;left:0;right:0;display:flex;justify-content:center;gap:10px;';

    const zoomInBtn = document.createElement('button');
    zoomInBtn.textContent = 'Zoom In';
    zoomInBtn.style.cssText = 'background:rgba(59, 130, 246, 0.7);color:white;border:none;padding:8px 16px;border-radius:4px;cursor:pointer;';

    const zoomOutBtn = document.createElement('button');
    zoomOutBtn.textContent = 'Zoom Out';
    zoomOutBtn.style.cssText = 'background:rgba(59, 130, 246, 0.7);color:white;border:none;padding:8px 16px;border-radius:4px;cursor:pointer;';

    const resetBtn = document.createElement('button');
    resetBtn.textContent = 'Reset';
    resetBtn.style.cssText = 'background:rgba(59, 130, 246, 0.7);color:white;border:none;padding:8px 16px;border-radius:4px;cursor:pointer;';

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.style.cssText = 'position:absolute;top:20px;right:20px;background:rgba(239, 68, 68, 0.7);color:white;border:none;padding:8px 16px;border-radius:4px;cursor:pointer;';

    // Add elements to DOM
    imgContainer.appendChild(img);
    controlsContainer.appendChild(zoomInBtn);
    controlsContainer.appendChild(zoomOutBtn);
    controlsContainer.appendChild(resetBtn);
    modal.appendChild(imgContainer);
    modal.appendChild(controlsContainer);
    modal.appendChild(closeBtn);

    // Current scale value
    let scale = 1;

    // Event handlers for zoom controls
    zoomInBtn.addEventListener('click', () => {
        scale += 0.25;
        img.style.transform = `scale(${scale})`;
    });

    zoomOutBtn.addEventListener('click', () => {
        if (scale > 0.5) scale -= 0.25;
        img.style.transform = `scale(${scale})`;
    });

    resetBtn.addEventListener('click', () => {
        scale = 1;
        img.style.transform = 'scale(1)';
    });

    // Close modal
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Export UI functions
window.ui = {
    showToast,
    updateTitle,
    addExamsToSchedule,
    sortScheduleTable,
    takeScreenshot,
    openScreenshotModal
};
