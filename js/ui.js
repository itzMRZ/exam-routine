// filepath: c:\Users\meher\Desktop\exam routine\exam-routine\exam-routine\js\ui.js
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
    document.querySelector('h1').textContent = `SUMMER-2025 ${examType} SCHEDULE`;
    document.title = `Summer-2025 ${examType} Schedule`;
}

/**
 * Sets a custom site title and H1 from a provided string
 * @param {string} title - Full title to display (will be used for H1 and document.title)
 */
function setCustomTitle(title) {
    if (!title || typeof title !== 'string') return;
    const h1 = document.querySelector('h1');
    if (h1) h1.textContent = title;
    try {
        document.title = title;
    } catch (e) {
        console.warn('Could not set document.title', e);
    }
}

/**
 * Updates the tiny last-update label under the title
 * @param {string|null} rawValue - ISO string or human-readable fallback
 */
function setLastUpdatedLabel(rawValue) {
    const label = document.getElementById('last-update');
    if (!label) return;

    if (!rawValue) {
        label.textContent = '';
        label.classList.add('hidden');
        return;
    }

    let formatted = rawValue;
    try {
        const parsed = new Date(rawValue);
        if (!Number.isNaN(parsed.getTime())) {
            const opts = { year: 'numeric', month: 'long', day: 'numeric' };
            formatted = parsed.toLocaleDateString(undefined, opts);
        }
    } catch (e) {
        console.warn('Failed to format last update date, using raw value', e);
    }

    label.textContent = `Last Update - ${formatted}`;
    label.classList.remove('hidden');
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
 * Takes a screenshot of the schedule table using a virtual viewport for consistency
 */
function takeScreenshot() {
    // Check if table has content
    const scheduleBody = document.getElementById('schedule-body');
    if (!scheduleBody || scheduleBody.children.length === 0) {
        showToast('No exams to screenshot. Please add courses first.', 'error');
        return;
    }

    // Show a notification that screenshot is being generated
    showToast('Saving Screenshot...', 'info');

    // Create a "Virtual Viewport" container
    // This container is isolated from the current viewport dimensions to ensure consistency on all devices.
    const virtualWidth = 850; // Tighter width for better mobile aspect ratio
    const container = document.createElement('div');
    container.id = 'virtual-screenshot-container';

    // Apply styles to force layout independent of device screen
    Object.assign(container.style, {
        position: 'fixed',
        left: '-9999px', // Move off-screen
        top: '0',
        width: `${virtualWidth}px`,
        backgroundColor: '#000000',
        padding: '20px',
        boxSizing: 'border-box',
        fontFamily: 'Arial, Helvetica, sans-serif',
        zIndex: '-9999',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
    });

    // --- Build Content Inside Virtual Viewport ---

    // 1. Title
    const originalTitle = document.querySelector('h1');
    const titleClone = document.createElement('h1');
    titleClone.textContent = originalTitle.textContent;
    Object.assign(titleClone.style, {
        color: '#ffffff',
        textAlign: 'center',
        fontSize: '36px',
        fontWeight: 'bold',
        marginBottom: '10px',
        width: '100%',
        lineHeight: '1.2'
    });
    container.appendChild(titleClone);

    // 2. Last Updated Label - REMOVED for screenshot
    // Add some spacing
    const spacer = document.createElement('div');
    spacer.style.height = '30px';
    container.appendChild(spacer);

    // 3. Reconstruct Table
    // We rebuild the table element-by-element to ensure perfect styling control
    const table = document.createElement('table');
    Object.assign(table.style, {
        width: '100%',
        borderCollapse: 'separate',
        borderSpacing: '0',
        border: '1px solid #ffffff',
        color: '#ffffff',
        fontSize: '16px', // Adjusted for tighter width
        textAlign: 'center',
        backgroundColor: '#000000'
    });

    // Table Header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const headers = ['Date', 'Time', 'Course', 'Section', 'Classroom'];

    headers.forEach((text, index) => {
        const th = document.createElement('th');
        th.textContent = text;
        Object.assign(th.style, {
            borderRight: index === headers.length - 1 ? 'none' : '1px solid #ffffff',
            borderBottom: '2px solid #ffffff',
            backgroundColor: '#111827', // Gray-900 background for header
            color: '#ffffff',
            padding: '10px',
            verticalAlign: 'middle',
            textAlign: 'center',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            lineHeight: '1.2'
        });
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Table Body
    const tbody = document.createElement('tbody');
    const rows = Array.from(scheduleBody.querySelectorAll('tr'));

    rows.forEach((row, rowIndex) => {
        const newRow = document.createElement('tr');
        const cells = Array.from(row.cells);

        cells.forEach((cell, cellIndex) => {
            const td = document.createElement('td');
            td.textContent = cell.textContent;
            Object.assign(td.style, {
                borderRight: cellIndex === cells.length - 1 ? 'none' : '1px solid #ffffff',
                borderBottom: rowIndex === rows.length - 1 ? 'none' : '1px solid #ffffff',
                backgroundColor: '#000000',
                color: '#ffffff',
                padding: '8px 10px 10px 10px', // Tighter padding
                verticalAlign: 'middle',
                textAlign: 'center',
                lineHeight: '1.2'
            });
            newRow.appendChild(td);
        });
        tbody.appendChild(newRow);
    });
    table.appendChild(tbody);
    container.appendChild(table);

    // 4. Footer / Watermark
    const footer = document.createElement('div');
    footer.innerHTML = 'Best of luck buddy, You got it ^_~';
    Object.assign(footer.style, {
        marginTop: '20px',
        width: '100%',
        textAlign: 'center',
        color: '#9ca3af', // Gray-400
        fontSize: '14px',
        fontStyle: 'italic'
    });
    container.appendChild(footer);

    // Append container to body so it can be rendered
    document.body.appendChild(container);

    // --- Capture Process ---

    // Check if html2canvas is loaded
    if (typeof html2canvas !== 'function') {
        console.error('html2canvas library not loaded');
        showToast('Screenshot failed - missing library.', 'error');
        document.body.removeChild(container);
        return;
    }

    // Small delay to ensure rendering is complete
    setTimeout(() => {
        html2canvas(container, {
            scale: 2, // 2x scale for Retina-like quality (results in 2400px width)
            useCORS: true,
            backgroundColor: '#000000',
            width: virtualWidth,
            windowWidth: virtualWidth, // Force the window width context
            logging: false,
            onclone: (clonedDoc) => {
                // Ensure the cloned body doesn't have scrollbars or weird offsets
                clonedDoc.body.style.margin = '0';
                clonedDoc.body.style.padding = '0';
            }
        }).then(canvas => {
            // Convert to image
            const imageUrl = canvas.toDataURL('image/png');

            // Store globally
            window.highQualityScreenshot = imageUrl;

            // Trigger Download
            const link = document.createElement('a');
            link.download = 'Exam-Schedule.png';
            link.href = imageUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            showToast('Schedule screenshot saved!', 'success');

            // Cleanup
            document.body.removeChild(container);
        }).catch(error => {
            console.error('Screenshot error:', error);
            showToast('Error taking screenshot.', 'error');
            if (document.body.contains(container)) {
                document.body.removeChild(container);
            }
        });
    }, 100);
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

    // Create container for the image
    const imgContainer = document.createElement('div');
    imgContainer.style.cssText = 'position:relative;width:90%;height:85%;display:flex;align-items:center;justify-content:center;overflow:hidden;padding:10px;';

    // Create the image element
    const img = document.createElement('img');
    img.id = 'screenshot-fullscreen-img';
    img.alt = 'Full Screen Schedule';
    img.src = imageUrl;
    img.style.cssText = 'max-width:100%;max-height:100%;object-fit:contain;box-shadow: 0 0 20px rgba(0,0,0,0.5);';

    // Add controls for zoom
    const controlsContainer = document.createElement('div');
    controlsContainer.style.cssText = 'position:absolute;bottom:20px;left:0;right:0;display:flex;justify-content:center;gap:10px;z-index:2001;';

    const btnStyle = 'background:rgba(59, 130, 246, 0.9);color:white;border:none;padding:8px 16px;border-radius:4px;cursor:pointer;font-weight:bold;';

    const zoomInBtn = document.createElement('button');
    zoomInBtn.textContent = 'Zoom In';
    zoomInBtn.style.cssText = btnStyle;

    const zoomOutBtn = document.createElement('button');
    zoomOutBtn.textContent = 'Zoom Out';
    zoomOutBtn.style.cssText = btnStyle;

    const resetBtn = document.createElement('button');
    resetBtn.textContent = 'Reset';
    resetBtn.style.cssText = btnStyle;

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.style.cssText = 'position:absolute;top:20px;right:20px;background:rgba(239, 68, 68, 0.9);color:white;border:none;padding:8px 16px;border-radius:4px;cursor:pointer;font-weight:bold;z-index:2001;';

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
    setCustomTitle,
    setLastUpdatedLabel,
    addExamsToSchedule,
    sortScheduleTable,
    takeScreenshot,
    openScreenshotModal
};
