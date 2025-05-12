// pdf-viewer.js - Functions for displaying PDF pages for cross-checking

/**
 * Initialize the PDF viewer functionality
 * @returns {Promise} - Promise that resolves when PDF.js is ready
 */
function initPdfViewer() {
    return new Promise((resolve, reject) => {
        // Check if PDF.js is already loaded
        if (window.pdfjsLib) {
            console.log('PDF.js already loaded');
            resolve();
            return;
        }

        // Load PDF.js from CDN
        console.log('Loading PDF.js library...');

        // First load the main PDF.js library
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js';
        script.onload = () => {
            // Then set the worker source
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
            console.log('PDF.js loaded successfully');

            // Check for successful PDF.js setup after a short delay
            setTimeout(() => {
                if (window.pdfjsLib) {
                    resolve();
                } else {
                    reject(new Error('PDF.js failed to initialize properly'));
                }
            }, 500);
        };

        script.onerror = () => {
            console.error('Failed to load PDF.js');
            reject(new Error('Failed to load PDF.js library'));
        };

        document.head.appendChild(script);
    });
}

/**
 * Open the cross-check modal and display relevant PDF pages
 * @param {Array} exams - The exams to display PDF pages for
 */
function openCrossCheckModal(exams) {
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

    // First check if PDF.js is loaded
    if (!window.pdfjsLib) {
        console.log('PDF.js not loaded, attempting to load it now');

        initPdfViewer()
            .then(() => {
                // PDF.js loaded, now continue with loading the PDF
                loadPdfForExams(exams, pdfContainer, loadingElement);
            })
            .catch(error => {
                console.error('Failed to load PDF.js:', error);
                pdfContainer.innerHTML = `
                    <div class="text-center py-4 text-red-500">
                        <i class="fas fa-exclamation-circle mr-2"></i>
                        Could not load PDF viewer. Please try refreshing the page.
                    </div>
                `;
            });
    } else {
        // PDF.js already loaded, proceed with loading the PDF
        loadPdfForExams(exams, pdfContainer, loadingElement);
    }
}

/**
 * Load the PDF and display pages for the given exams
 * @param {Array} exams - The exams to display
 * @param {HTMLElement} container - The container to render into
 * @param {HTMLElement} loadingElement - The loading indicator element
 */
function loadPdfForExams(exams, container, loadingElement) {
    // Try multiple possible locations for the PDF
    const possiblePdfUrls = [
        'examData.pdf',
        window.location.href.substring(0, window.location.href.lastIndexOf('/')) + '/examData.pdf',
        window.location.origin + '/examData.pdf',
        'exam_data.pdf'
    ];

    console.log('Attempting to load PDF from possible locations:', possiblePdfUrls);

    // Use the pdf helper to try loading from multiple URLs
    if (window.pdfHelper && typeof window.pdfHelper.enhancedCrossCheck === 'function') {
        // Use the enhanced cross-check from pdfHelper if available
        console.log('Using enhancedCrossCheck from pdfHelper');
        window.pdfHelper.enhancedCrossCheck(exams);
    } else {
        // Fallback to direct loading if pdfHelper is not available
        console.log('pdfHelper not available, using basic PDF loading');

        // Try to load PDF from first URL
        tryLoadingPdf(possiblePdfUrls, 0, exams, container, loadingElement);
    }
}

/**
 * Try loading PDF from one of the URLs in the list
 * @param {Array<string>} urls - Array of possible PDF URLs
 * @param {number} index - Current URL index
 * @param {Array} exams - Exams to display
 * @param {HTMLElement} container - Container for rendering
 * @param {HTMLElement} loadingElement - Loading indicator
 */
function tryLoadingPdf(urls, index, exams, container, loadingElement) {
    if (index >= urls.length) {
        console.error('Could not load PDF from any of the provided URLs');
        container.innerHTML = `
            <div class="text-center py-4 text-red-500">
                <i class="fas fa-exclamation-circle mr-2"></i>
                Could not find the exam PDF file.
                <small class="block mt-2">Please make sure examData.pdf exists in the application folder.</small>
            </div>
        `;
        return;
    }

    console.log(`Trying to load PDF from: ${urls[index]}`);

    // Load the PDF document
    const loadingTask = window.pdfjsLib.getDocument(urls[index]);

    loadingTask.promise.then(function(pdfDocument) {
        // PDF loaded successfully
        console.log(`PDF successfully loaded from: ${urls[index]}`);

        // Remove loading indicator
        container.removeChild(loadingElement);

        // Create header for the modal content
        const header = document.createElement('div');
        header.className = 'text-xl font-bold text-center mb-4';
        header.textContent = 'Cross-Check Your Exams';
        container.appendChild(header);

        // Create a description
        const description = document.createElement('p');
        description.className = 'text-sm text-center mb-4';
        description.textContent = 'Verify your exam details with the original PDF schedule';
        container.appendChild(description);

        // Function to render a specific page
        const renderPage = function(pageNum, exam) {
            return pdfDocument.getPage(pageNum).then(function(page) {
                // For mobile responsiveness, adjust scale based on screen width
                const maxWidth = window.innerWidth > 768 ? 800 : window.innerWidth - 60;
                const viewport = page.getViewport({ scale: 1.0 });
                const scale = maxWidth / viewport.width;
                const scaledViewport = page.getViewport({ scale });

                // Create canvas for this page
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = scaledViewport.height;
                canvas.width = scaledViewport.width;
                canvas.style.width = '100%';
                canvas.style.height = 'auto';

                // Create a container for this exam's info and page
                const examContainer = document.createElement('div');
                examContainer.className = 'bg-gray-900 rounded-lg p-4 mb-4';

                // Add exam info header
                const examInfo = document.createElement('div');
                examInfo.className = 'text-white mb-2 text-center';

                examInfo.innerHTML = `
                    <span class="font-bold">${exam.courseCode}</span>
                    <span>Section ${exam.section}</span>
                    <div class="text-xs text-gray-300 mt-1">
                        ${exam.date} • ${exam.time} • Room ${exam.classroom}
                    </div>
                    <div class="text-xs text-gray-400 mt-1">
                        PDF Page: ${pageNum} ${exam.pageNumber === pageNum ? '<span class="bg-green-700 text-white px-1 py-0.5 ml-1 text-xs rounded">✓ Direct match</span>' : ''}
                    </div>
                `;
                examContainer.appendChild(examInfo);

                // Add canvas to container
                const canvasContainer = document.createElement('div');
                canvasContainer.className = 'overflow-x-auto';
                canvasContainer.appendChild(canvas);
                examContainer.appendChild(canvasContainer);

                container.appendChild(examContainer);

                // Render PDF page into canvas context
                const renderContext = {
                    canvasContext: context,
                    viewport: scaledViewport
                };

                return page.render(renderContext).promise;
            });
        };

        // Find pages for exams based on their page numbers in the data
        const renderExamsWithPageNumbers = () => {
            // Filter exams that have valid page numbers
            const examsWithPages = exams.filter(exam => exam.pageNumber && exam.pageNumber > 0);

            if (examsWithPages.length === 0) {
                // If no exams have page numbers, fall back to showing first pages
                const noPageMsg = document.createElement('div');
                noPageMsg.className = 'text-yellow-500 text-center mb-4';
                noPageMsg.innerHTML = `
                    <i class="fas fa-exclamation-triangle mr-2"></i>
                    No page numbers found in data. Showing first pages instead.
                `;
                container.appendChild(noPageMsg);

                // Show first few pages
                const pagesToShow = Math.min(pdfDocument.numPages, exams.length, 5);
                const renderPromises = [];

                for (let i = 0; i < pagesToShow; i++) {
                    const pageNum = i + 1;
                    renderPromises.push(renderPage(pageNum, exams[i]));
                }

                return Promise.all(renderPromises);
            } else {
                // Show pages corresponding to exams with page numbers
                const limitedExams = examsWithPages.slice(0, 5); // Limit to 5 exams
                const renderPromises = [];

                for (const exam of limitedExams) {
                    renderPromises.push(renderPage(exam.pageNumber, exam));
                }

                // Show a message if more exams exist
                if (exams.length > limitedExams.length) {
                    const moreInfo = document.createElement('div');
                    moreInfo.className = 'text-center text-sm text-gray-400 mt-4';
                    moreInfo.textContent = `Only showing ${limitedExams.length} of ${exams.length} exams. Please check more by adding fewer courses at a time.`;
                    container.appendChild(moreInfo);
                }

                return Promise.all(renderPromises);
            }
        };

        renderExamsWithPageNumbers().catch(err => {
            console.error('Error rendering exam pages:', err);
            const errorMsg = document.createElement('div');
            errorMsg.className = 'text-red-500 text-center';
            errorMsg.innerHTML = `
                <i class="fas fa-exclamation-circle mr-2"></i>
                Error rendering PDF pages: ${err.message}
            `;
            container.appendChild(errorMsg);
        });
    }).catch(function(error) {
        console.error(`Error loading PDF from ${urls[index]}:`, error);
        // Try the next URL
        tryLoadingPdf(urls, index + 1, exams, container, loadingElement);
    });
}

/**
 * Close the cross-check modal
 */
function closeCrossCheckModal() {
    const modal = document.getElementById('cross-check-modal');
    modal.classList.add('hidden');
}

// Export PDF viewer functions
window.pdfViewer = {
    initPdfViewer,
    openCrossCheckModal,
    closeCrossCheckModal
};
