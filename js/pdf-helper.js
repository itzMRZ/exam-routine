// pdf-helper.js - PDF helper functions for the exam routine application

/**
 * Converts an ArrayBuffer to a base64 string
 * @param {ArrayBuffer} buffer - The buffer to convert
 * @returns {string} - Base64 encoded string
 */
function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

/**
 * Fetches a PDF file and converts it to a data URL
 * @param {string} pdfUrl - URL of the PDF to fetch
 * @returns {Promise<string>} - Promise resolving with a data URL
 */
function fetchPdfAsDataUrl(pdfUrl) {
    return fetch(pdfUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
            }
            return response.arrayBuffer();
        })
        .then(arrayBuffer => {
            const base64 = arrayBufferToBase64(arrayBuffer);
            return `data:application/pdf;base64,${base64}`;
        });
}

/**
 * Find the pages in the PDF document based on page numbers from the exam data
 * @param {Object} pdfDocument - The PDF document
 * @param {Array} exams - Array of exam objects with courseCode, section, and pageNumber
 * @returns {Array} - Array of exam-page mappings
 */
function findPagesForExams(pdfDocument, exams) {
    const mappings = [];
    const totalPages = pdfDocument.numPages;

    console.log("PDF has", totalPages, "total pages");
    console.log("Exams to process:", exams.length);

    // For each exam, use the page number from the exam data
    for (const exam of exams) {
        const courseCode = exam.courseCode;
        const section = exam.section;
        const pageNumber = exam.pageNumber || -1;

        console.log(`Looking up ${courseCode} Section ${section} - Page Number: ${pageNumber}`);

        // Check if the page number is valid
        if (pageNumber > 0 && pageNumber <= totalPages) {
            console.log(`Using page ${pageNumber} for ${courseCode} Section ${section}`);
            mappings.push({
                exam: exam,
                pageNumber: pageNumber
            });
        } else {
            console.log(`No valid page number found for ${courseCode} Section ${section}`);
            mappings.push({
                exam: exam,
                pageNumber: -1 // Indicates not found
            });
        }
    }

    return mappings;
}

/**
 * Try loading PDF from multiple possible URLs
 * @param {Array<string>} urls - Array of possible URLs to try
 * @param {number} index - Current URL index to try
 * @returns {Promise<string>} - Promise resolving with a working PDF data URL
 */
function tryPdfUrls(urls, index = 0) {
    if (index >= urls.length) {
        return Promise.reject(new Error('Could not load PDF from any of the provided URLs'));
    }

    return fetchPdfAsDataUrl(urls[index])
        .then(dataUrl => {
            console.log(`Successfully loaded PDF from: ${urls[index]}`);
            return dataUrl;
        })
        .catch(error => {
            console.warn(`Failed to load PDF from ${urls[index]}:`, error);
            // Try next URL
            return tryPdfUrls(urls, index + 1);
        });
}

/**
 * Enhanced function for opening a cross-check modal with improved PDF loading
 * @param {Array} exams - The exams to display PDF pages for
 */
function enhancedCrossCheck(exams) {
    if (!exams || exams.length === 0) {
        ui.showToast('No exams to cross-check. Please add courses first.', 'error');
        return;
    }

    const modal = document.getElementById('cross-check-modal');
    const pdfContainer = document.getElementById('pdf-container');

    // Clear previous content
    pdfContainer.innerHTML = '';

    // Show the modal
    modal.classList.remove('hidden');

    // Create a loading indicator
    const loadingElement = document.createElement('div');
    loadingElement.className = 'text-white text-center py-4';
    loadingElement.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Loading PDF...';
    pdfContainer.appendChild(loadingElement);

    // Try loading and rendering the PDF
    const possiblePdfUrls = [
        'examData.pdf',
        window.location.href.substring(0, window.location.href.lastIndexOf('/')) + '/examData.pdf',
        window.location.origin + '/examData.pdf'
    ];

    tryPdfUrls(possiblePdfUrls)
        .then(pdfDataUrl => {
            // Now we have a data URL, we can render the PDF
            renderPdfWithExams(pdfDataUrl, exams, pdfContainer, loadingElement);
        })
        .catch(error => {
            console.error('Error loading PDF:', error);
            // Show error in the container
            pdfContainer.removeChild(loadingElement);
            pdfContainer.innerHTML = `
                <div class="text-center py-4 text-red-500">
                    <i class="fas fa-exclamation-circle mr-2"></i>
                    Could not load PDF file.<br>
                    <small class="block mt-2">Please check that the PDF file is accessible.</small>
                    <button id="retry-pdf-btn" class="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                        Retry Loading PDF
                    </button>
                </div>
            `;

            // Add retry button event listener
            document.getElementById('retry-pdf-btn').addEventListener('click', () => {
                enhancedCrossCheck(exams);
            });
        });
}

/**
 * Renders a PDF with exam information
 * @param {string} pdfDataUrl - The PDF data URL
 * @param {Array} exams - The exams to highlight
 * @param {HTMLElement} container - The container to render into
 * @param {HTMLElement} loadingElement - The loading indicator element
 */
function renderPdfWithExams(pdfDataUrl, exams, container, loadingElement) {
    console.log('Rendering PDF with exams:', exams.length);

    if (!pdfjsLib) {
        console.error('PDF.js library not loaded');
        container.innerHTML = `
            <div class="text-center py-4 text-red-500">
                <i class="fas fa-exclamation-circle mr-2"></i>
                PDF.js library not loaded. Please check your internet connection.
            </div>
        `;
        return;
    }

    // Create a header
    const header = document.createElement('div');
    header.className = 'text-xl font-bold text-white text-center mb-4';
    header.textContent = 'Cross-Check Your Exams';

    // Remove loading element and add header
    container.removeChild(loadingElement);
    container.appendChild(header);

    // Load the PDF document
    pdfjsLib.getDocument(pdfDataUrl).promise
        .then(pdfDocument => {
            console.log(`PDF loaded with ${pdfDocument.numPages} pages`);

            // Find pages for each exam
            const examPageMappings = findPagesForExams(pdfDocument, exams);
            console.log("Found page mappings:", examPageMappings);

            let renderPromises = [];
            let pagesRendered = 0;

            // Filter mappings to only include found pages
            const validMappings = examPageMappings.filter(mapping => mapping.pageNumber > 0);

            if (validMappings.length === 0) {
                console.log('No valid page numbers found for any exams.');

                const noFound = document.createElement('div');
                noFound.className = 'text-center py-4 text-yellow-500';
                noFound.innerHTML = `
                    <i class="fas fa-exclamation-triangle mr-2"></i>
                    No valid page numbers found in the data for your courses.<br>
                    <small class="block mt-2">Showing the first 5 pages of the PDF instead.</small>
                    <div class="text-xs text-gray-400 mt-2">
                        Please make sure your courses have valid page numbers in the data.
                    </div>
                `;
                container.appendChild(noFound);

                // Show a helpful message about page numbers
                const pageHelp = document.createElement('div');
                pageHelp.className = 'text-center text-sm text-blue-400 mt-2 mb-4';
                pageHelp.innerHTML = `
                    <p>Make sure your data includes page numbers.</p>
                    <p class="mt-1">The format should be: <code class="bg-gray-700 px-1 py-0.5 rounded">"Page Number": 28</code></p>
                `;
                container.appendChild(pageHelp);

                // Add page info button
                const debugBtn = document.createElement('button');
                debugBtn.className = 'mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded';
                debugBtn.textContent = 'Show Page Numbers';
                debugBtn.onclick = () => {
                    const pageInfo = exams.map(e => `${e.courseCode} Section ${e.section}: Page ${e.pageNumber || 'Not specified'}`).join('\n');
                    alert('Page numbers for your courses:\n\n' + pageInfo);
                };
                container.appendChild(debugBtn);

                // Fall back to showing first few pages
                const pagesToShowCount = Math.min(pdfDocument.numPages, exams.length, 5);
                pagesRendered = pagesToShowCount;

                for (let i = 1; i <= pagesToShowCount; i++) {
                    renderPromises.push(renderExamPage(pdfDocument, i, exams[i-1], container));
                }
            } else {
                // Sort by the original order of exams
                validMappings.sort((a, b) => {
                    const indexA = exams.findIndex(e =>
                        e.courseCode === a.exam.courseCode && e.section === a.exam.section);
                    const indexB = exams.findIndex(e =>
                        e.courseCode === b.exam.courseCode && e.section === b.exam.section);
                    return indexA - indexB;
                });

                // Limit to 5 exams to prevent excessive rendering
                const mappingsToRender = validMappings.slice(0, 5);
                pagesRendered = mappingsToRender.length;

                // Render each exam page
                mappingsToRender.forEach(mapping => {
                    renderPromises.push(renderExamPage(pdfDocument, mapping.pageNumber, mapping.exam, container));
                });
            }

            return Promise.all(renderPromises).then(() => {
                // If there are more exams than we rendered, show a message
                if (exams.length > pagesRendered) {
                    const moreInfo = document.createElement('div');
                    moreInfo.className = 'text-center text-sm text-gray-400 mt-4';
                    moreInfo.textContent = `Only showing ${pagesRendered} of ${exams.length} exams. Please check more by adding fewer courses at a time.`;
                    container.appendChild(moreInfo);
                }
            });
        })
        .catch(error => {
            console.error('Error rendering PDF:', error);
            container.innerHTML = `
                <div class="text-center py-4 text-red-500">
                    <i class="fas fa-exclamation-circle mr-2"></i>
                    Error rendering the PDF: ${error.message || 'Unknown error'}
                </div>
            `;
        });
}

/**
 * Render a single PDF page with exam information
 * @param {Object} pdfDocument - The PDF document
 * @param {number} pageNum - The page number to render
 * @param {Object} exam - The exam object
 * @param {HTMLElement} container - The container to render into
 * @returns {Promise} - Promise that resolves when rendering is complete
 */
function renderExamPage(pdfDocument, pageNum, exam, container) {
    return pdfDocument.getPage(pageNum).then(page => {
        // For mobile responsiveness, adjust scale based on screen width
        const maxWidth = window.innerWidth > 768 ? 800 : window.innerWidth - 60;
        const initialViewport = page.getViewport({ scale: 1.0 });
        const dpr = window.devicePixelRatio || 1;
        const scaleFactor = (maxWidth / initialViewport.width) * dpr;
        const viewport = page.getViewport({ scale: scaleFactor });

        // Create exam container
        const examContainer = document.createElement('div');
        examContainer.className = 'bg-gray-900 rounded-lg p-4 mb-4';

        // Add exam info header
        examContainer.innerHTML = `
            <div class="text-white mb-2 text-center">
                <span class="font-bold">${exam.courseCode}</span>
                <span>Section ${exam.section}</span>
                <div class="text-xs text-gray-300 mt-1">
                    ${exam.date} • ${exam.time} • Room ${exam.classroom}
                </div>
                <div class="text-xs text-gray-400 mt-1">
                    PDF Page: ${pageNum} ${exam.pageNumber === pageNum ? '<span class="bg-green-700 text-white px-1 py-0.5 ml-1 text-xs rounded">✓ Direct match</span>' : ''}
                </div>
            </div>
        `;

        // Create canvas for PDF rendering
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = (viewport.width / dpr) + 'px';
        canvas.style.height = (viewport.height / dpr) + 'px';
        canvas.id = `pdf-canvas-${pageNum}-${exam.courseCode}-${exam.section}`;

        // Add canvas to container
        const canvasContainer = document.createElement('div');
        canvasContainer.className = 'overflow-x-auto';
        canvasContainer.appendChild(canvas);
        examContainer.appendChild(canvasContainer);

        // Add full screen button
        const fullScreenButton = document.createElement('button');
        fullScreenButton.className = 'mt-3 px-3 py-1.5 bg-blue-500 text-white text-sm rounded flex items-center justify-center mx-auto hover:bg-blue-600 transition';
        fullScreenButton.innerHTML = '<i class="fas fa-expand-arrows-alt mr-1"></i> View Full Screen';
        fullScreenButton.onclick = (e) => {
            e.stopPropagation();
            openFullScreenModal(canvas.toDataURL('image/png'));
        };
        examContainer.appendChild(fullScreenButton);

        container.appendChild(examContainer);

        // Render PDF page into canvas context
        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };

        return page.render(renderContext).promise.then(() => {
            // Highlight bounding box if provided
            if (exam.boundingBox && typeof exam.boundingBox.x0 === 'number') {
                const { x0, y0, x1, y1 } = exam.boundingBox;
                // PDF user-space height
                const pdfPageHeight = initialViewport.height;
                // Adjust if Python coordinates used top-left origin
                const pdfY0 = pdfPageHeight - y1; // invert y1
                const pdfY1 = pdfPageHeight - y0; // invert y0
                // Debug log raw and adjusted coords
                console.log('Raw bbox:', [x0, y0, x1, y1], 'Adjusted bbox:', [x0, pdfY0, x1, pdfY1]);
                // Convert to viewport rectangle
                const [left, top, right, bottom] = viewport.convertToViewportRectangle([x0, pdfY0, x1, pdfY1]);
                context.save();
                context.lineWidth = 2;
                context.strokeStyle = 'red';
                context.strokeRect(left, top, right - left, bottom - top);
                context.restore();
            }
        });
    });
}

/**
 * Open a full screen modal with the given image URL
 * @param {string} imageUrl - The image URL to display
 */
function openFullScreenModal(imageUrl) {
    // Get the modal or create it if it doesn't exist
    let modal = document.getElementById('pdf-fullscreen-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'pdf-fullscreen-modal';
        modal.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.95);z-index:2000;display:flex;align-items:center;justify-content:center;';
        document.body.appendChild(modal);
    }

    // Set up modal content with simple, responsive image and reset zoom button
    modal.innerHTML = `
        <div style="position:relative;width:85%;height:85%;display:flex;align-items:center;justify-content:center;overflow:hidden;padding:15px;border:2px solid rgba(255,255,255,0.15);border-radius:12px;background:rgba(0,0,0,0.3);">
            <img id="pdf-fullscreen-img" src="${imageUrl}" alt="Full Screen PDF Image"
                style="max-width:100%;max-height:100%;border-radius:8px;background:#fff;transform-origin:center;transition:transform 0.2s ease;" />
            <button id="reset-zoom-btn"
                style="position:absolute;bottom:20px;right:20px;background:rgba(59,130,246,0.8);color:#fff;border:none;border-radius:4px;padding:8px 16px;cursor:pointer;z-index:2001;">
                Reset Zoom
            </button>
        </div>
        <button id="close-fullscreen-btn"
            style="position:absolute;top:20px;right:20px;font-size:24px;background:rgba(0,0,0,0.7);color:#fff;border:none;border-radius:4px;padding:8px 16px;cursor:pointer;z-index:2001;">
            Close
        </button>
    `;

    // Show the modal
    modal.style.display = 'flex';

    // Minimal zoom logic for practicality (no pan, just zoom in/out/reset)
    const img = modal.querySelector('#pdf-fullscreen-img');
    let scale = 1;

    // Mouse wheel zoom
    modal.addEventListener('wheel', function(e) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.15 : 0.15;
        scale = Math.max(1, Math.min(3, scale + delta));
        img.style.transform = `scale(${scale})`;
    }, { passive: false });

    // Reset zoom button
    document.getElementById('reset-zoom-btn').addEventListener('click', function() {
        scale = 1;
        img.style.transform = 'scale(1)';
    });

    // Double click to reset zoom
    img.addEventListener('dblclick', function() {
        scale = 1;
        img.style.transform = 'scale(1)';
    });

    // Close button functionality
    document.getElementById('close-fullscreen-btn').addEventListener('click', function() {
        modal.style.display = 'none';
    });

    // Close on background click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Export PDF helper functions
window.pdfHelper = {
    arrayBufferToBase64,
    fetchPdfAsDataUrl,
    tryPdfUrls,
    enhancedCrossCheck,
    renderPdfWithExams,
    renderExamPage,
    findPagesForExams,
    openFullScreenModal
};
