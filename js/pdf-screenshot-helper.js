// filepath: c:\Users\meher\Desktop\exam routine\exam-routine\exam-routine\js\pdf-screenshot-helper.js
// pdf-screenshot-helper.js - Helper functions for PDF screenshots in the cross-check section

// Debug: Confirm the script is loaded
console.log('PDF Screenshot Helper loaded successfully');

// Create a global variable to track load status
window.PDF_SCREENSHOT_HELPER_LOADED = true;

/**
 * Applies a 9% crop to left/right sides and 2% to top/bottom of a PDF screenshot
 * @param {HTMLCanvasElement} canvas - The canvas element containing the PDF screenshot
 * @returns {HTMLCanvasElement} - A new canvas with the cropped image
 */
function cropPdfScreenshot(canvas) {    // Apply different crop percentages for sides vs top/bottom
    const cropPercentSides = 0.09; // 9% crop on left and right sides
    const cropPercentTopBottom = 0.02; // 2% crop on top and bottom
    const cropX = Math.floor(canvas.width * cropPercentSides);
    const cropY = Math.floor(canvas.height * cropPercentTopBottom);
    const croppedWidth = canvas.width - (cropX * 2);
    const croppedHeight = canvas.height - (cropY * 2);

    // Create a new canvas for the cropped image
    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = croppedWidth;
    croppedCanvas.height = croppedHeight;
    const ctx = croppedCanvas.getContext('2d');

    // Draw the cropped image on the new canvas
    ctx.drawImage(
        canvas,
        cropX, cropY, croppedWidth, croppedHeight, // Source rectangle
        0, 0, croppedWidth, croppedHeight         // Destination rectangle
    );

    // Log a debug message to confirm cropping was applied
    console.log(`Cropped canvas from ${canvas.width}x${canvas.height} to ${croppedCanvas.width}x${croppedCanvas.height}`);

    return croppedCanvas;
}

/**
 * Applies a 9% crop to left/right sides and 2% to top/bottom of an image from its data URL
 * @param {string} imageUrl - The data URL of the image
 * @param {function} callback - Callback function that receives the cropped image data URL
 */
function cropImageFromUrl(imageUrl, callback) {
    console.log('Starting image cropping from URL');

    const tempImg = new Image();    tempImg.onload = function() {
        // Apply different crop percentages for sides vs top/bottom
        const cropPercentSides = 0.09; // 9% crop on left and right sides
        const cropPercentTopBottom = 0.02; // 2% crop on top and bottom
        const cropX = Math.floor(tempImg.width * cropPercentSides);
        const cropY = Math.floor(tempImg.height * cropPercentTopBottom);
        const croppedWidth = tempImg.width - (cropX * 2);
        const croppedHeight = tempImg.height - (cropY * 2);

        console.log(`Original image: ${tempImg.width}x${tempImg.height}, Cropped: ${croppedWidth}x${croppedHeight}`);

        // Create canvas for cropping
        const canvas = document.createElement('canvas');
        canvas.width = croppedWidth;
        canvas.height = croppedHeight;
        const ctx = canvas.getContext('2d');

        // Draw the cropped image on canvas
        ctx.drawImage(
            tempImg,
            cropX, cropY, croppedWidth, croppedHeight, // Source rectangle
            0, 0, croppedWidth, croppedHeight         // Destination rectangle
        );

        // Return the cropped image data URL
        const croppedImageUrl = canvas.toDataURL('image/png');
        console.log('Image cropped successfully');
        callback(croppedImageUrl);
    };

    tempImg.onerror = function(error) {
        console.error('Error loading image for cropping:', error);
        // Return the original URL if there's an error
        callback(imageUrl);
    };

    tempImg.src = imageUrl;
}

// Export functions for use in other modules
window.pdfScreenshotHelper = {
    cropPdfScreenshot,
    cropImageFromUrl
};
