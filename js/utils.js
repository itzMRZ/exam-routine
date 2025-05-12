// utils.js - Utility functions for the application

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to delay
 * @return {Function} - The debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Formats date from "YYYY-MM-DD" to "D-MMM-YY" or handles already formatted dates
 * @param {string} dateStr - The date string to format
 * @return {string} - The formatted date string
 */
function formatDateFromJSON(dateStr) {
    if (!dateStr) return '';
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Try to parse D-MMM-YY format (e.g. "20-Mar-25")
    const dmyPattern = /^([0-9]{1,2})-([A-Za-z]{3})-([0-9]{2,4})$/;
    // Try to parse YYYY-MM-DD format (e.g. "2025-03-20")
    const ymdPattern = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/;

    if (dmyPattern.test(dateStr)) {
        const [_, day, month, year] = dmyPattern.exec(dateStr);
        return `${parseInt(day)}-${month}-${year.length === 2 ? year : year.slice(-2)}`;
    } else if (ymdPattern.test(dateStr)) {
        const [_, year, month, day] = ymdPattern.exec(dateStr);
        const monthIndex = parseInt(month) - 1;
        if (monthIndex >= 0 && monthIndex < 12) {
            return `${parseInt(day)}-${monthNames[monthIndex]}-${year.slice(-2)}`;
        }
    }
    return dateStr;
}

/**
 * Converts a date string to a standard format for comparison
 * @param {string} dateStr - The date string to convert
 * @return {string} - The converted date string
 */
function convertDate(dateStr) {
    try {
        const parts = dateStr.split('-');
        if (parts.length !== 3) return dateStr;

        // If the date is already in D-MMM-YY format
        if (parts[1].length === 3 && isNaN(parts[1])) {
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const day = parseInt(parts[0]);
            const monthIndex = monthNames.findIndex(m => m === parts[1]);
            const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];

            // Format as YYYY-MM-DD for Date object
            const month = (monthIndex + 1).toString().padStart(2, '0');
            const dayStr = day.toString().padStart(2, '0');
            return `${year}-${month}-${dayStr}`;
        }

        return dateStr;
    } catch (e) {
        console.error('Error converting date:', e);
        return dateStr;
    }
}

/**
 * Converts 24-hour time format to "h:mm AM/PM" format
 * @param {string} timeString - Time in 24-hour format (HH:MM)
 * @return {string} - Time in 12-hour format with AM/PM
 */
function convertToAMPM(timeString) {
    const [hourStr, minuteStr] = timeString.split(':');
    let hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12;
    if (hour === 0) hour = 12;
    return `${hour}:${minute.toString().padStart(2, '0')} ${ampm}`;
}

/**
 * Combines start and end times into a formatted time range
 * @param {string} startTime - Start time in 24-hour format
 * @param {string} endTime - End time in 24-hour format
 * @return {string} - Formatted time range
 */
function convertTimeFromJSON(startTime, endTime) {
    return `${convertToAMPM(startTime)} - ${convertToAMPM(endTime)}`;
}

/**
 * Converts time string to minutes for sorting
 * @param {string} timeString - Time string in "h:mm AM/PM" format
 * @return {number} - Minutes since midnight
 */
function convertTimeToMinutes(timeString) {
    const [time, period] = timeString.split(' ');
    let [hours, minutes] = time.split(':').map(Number);

    if (period === 'PM' && hours < 12) {
        hours += 12;
    } else if (period === 'AM' && hours === 12) {
        hours = 0;
    }

    return hours * 60 + minutes;
}

// Export functions
window.utils = {
    debounce,
    formatDateFromJSON,
    convertDate,
    convertToAMPM,
    convertTimeFromJSON,
    convertTimeToMinutes
};
