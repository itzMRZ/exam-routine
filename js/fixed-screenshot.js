/**
 * This file contains a fixed version of the screenshot functionality
 * To fix the screenshot issue, replace the takeScreenshot function in ui.js with this one
 */

function takeScreenshot() {
    // Check if table has content
    if (document.getElementById('schedule-body').children.length === 0) {
        showToast('No exams to screenshot. Please add courses first.', 'error');
        return;
    }

    showToast('Creating screenshot...', 'info');

    // Check if html2canvas is available
    if (typeof html2canvas !== 'function') {
        console.error('html2canvas not found! Check if the library is loaded.');
        showToast('Screenshot failed: Required library is missing', 'error');
        return;
    }

    try {
        // Create a temporary container that includes only what we want in the screenshot
        const tempContainer = document.createElement('div');
        tempContainer.className = 'bg-black p-6 rounded';
        tempContainer.style.color = 'white'; // Ensure text is white

        // Add the title
        const title = document.createElement('h1');
        title.className = 'text-2xl font-bold mb-6 text-center';
        title.style.color = 'white';
        title.textContent = document.querySelector('h1').textContent;
        tempContainer.appendChild(title);

        // Create a new table from scratch
        const newTable = document.createElement('table');
        newTable.className = 'min-w-full border border-white text-center';
        newTable.style.borderCollapse = 'collapse';
        newTable.style.width = '100%';
        newTable.style.border = '1px solid white';
        newTable.style.fontSize = '16px';
        newTable.style.color = 'white';
        newTable.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';

        // Create table header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        headerRow.style.borderBottom = '1px solid white';

        const headers = ['Date', 'Time', 'Course', 'Section', 'Classroom'];

        headers.forEach(text => {
            const th = document.createElement('th');
            th.className = 'px-3 py-3 text-center';
            th.style.color = 'white';

            const contentDiv = document.createElement('div');
            contentDiv.style.display = 'flex';
            contentDiv.style.justifyContent = 'center';
            contentDiv.style.alignItems = 'center';
            contentDiv.style.minHeight = '30px';
            contentDiv.style.padding = '5px';
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

                const contentDiv = document.createElement('div');
                contentDiv.style.display = 'flex';
                contentDiv.style.justifyContent = 'center';
                contentDiv.style.alignItems = 'center';
                contentDiv.style.minHeight = '30px';
                contentDiv.style.padding = '5px';
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

        // Define the crop function separately to ensure it exists
        const cropCanvas = function(inputCanvas) {
            const cropPercentSides = 0.09; // 9% from sides
            const cropPercentTopBottom = 0.02; // 2% from top/bottom

            const cropX = Math.floor(inputCanvas.width * cropPercentSides);
            const cropY = Math.floor(inputCanvas.height * cropPercentTopBottom);
            const croppedWidth = Math.floor(inputCanvas.width - (cropX * 2));
            const croppedHeight = Math.floor(inputCanvas.height - (cropY * 2));

            const croppedCanvas = document.createElement('canvas');
            croppedCanvas.width = croppedWidth;
            croppedCanvas.height = croppedHeight;

            const ctx = croppedCanvas.getContext('2d');
            ctx.drawImage(
                inputCanvas,
                cropX, cropY, croppedWidth, croppedHeight,
                0, 0, croppedWidth, croppedHeight
            );

            console.log(`Cropped from ${inputCanvas.width}x${inputCanvas.height} to ${croppedWidth}x${croppedHeight}`);
            return croppedCanvas;
        };

        // Take screenshot with html2canvas
        html2canvas(tempContainer, {
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            logging: false,
            scale: 4,
            useCORS: true,
            allowTaint: true,
            removeContainer: false // Don't let html2canvas remove our container
        }).then(function(canvas) {
            console.log('Screenshot captured successfully');

            try {
                // Try to crop the screenshot
                canvas = cropCanvas(canvas);
                console.log('Screenshot cropped successfully');
            } catch(cropError) {
                console.error('Error during cropping:', cropError);
                // Continue with uncropped screenshot
            }

            // Store the result
            window.highQualityScreenshot = canvas.toDataURL('image/png');

            // Create download link
            const link = document.createElement('a');
            link.download = 'Spring25-Exam-Schedule.png';
            link.href = window.highQualityScreenshot;
            document.body.appendChild(link);

            // Trigger download
            link.click();

            // Clean up
            setTimeout(() => {
                document.body.removeChild(link);
                if (document.body.contains(tempContainer)) {
                    document.body.removeChild(tempContainer);
                }
            }, 100);

            // Show success message
            showToast('Schedule screenshot saved!', 'success');
        }).catch(function(error) {
            console.error('Screenshot error:', error);
            showToast('Error creating screenshot. Please try again.', 'error');
            if (document.body.contains(tempContainer)) {
                document.body.removeChild(tempContainer);
            }
        });
    } catch (error) {
        console.error('General error in screenshot process:', error);
        showToast('Error creating screenshot. Please try again.', 'error');
    }
}
