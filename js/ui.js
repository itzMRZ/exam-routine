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
    document.body.appendChild(tempContainer);

    // Take screenshot of the temporary element
    html2canvas(tempContainer, {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        logging: false,
        scale: 2, // Higher resolution
        useCORS: true,
        allowTaint: true
    }).then(canvas => {
        // Create download link
        const link = document.createElement('a');
        link.download = 'Spring25-Exam-Schedule.png';
        link.href = canvas.toDataURL('image/png');
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

// Export UI functions
window.ui = {
    showToast,
    updateTitle,
    addExamsToSchedule,
    sortScheduleTable,
    takeScreenshot
};
