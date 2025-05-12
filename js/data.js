// data.js - Data loading and manipulation functions

// Store the exam data and course information globally
let examData = [];
let availableCourses = new Set();
let isFinalsSchedule = false; // Track if we're showing finals or midterms

// Course to sections mapping for quick lookups
let courseSections = {};

/**
 * Load schedule data from the JSON file
 * @return {Promise} - Promise that resolves when data is loaded
 */
function loadScheduleData() {
    console.log("Fetching exam data...");
    return fetch('exam_data.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Determine if this is finals schedule by checking first exam
            if (data.exams && data.exams.length > 0) {
                isFinalsSchedule = 'Final Date' in data.exams[0];
                ui.updateTitle(isFinalsSchedule);
            }

            // Filter out entries that don't have all required fields
            examData = data.exams
                .filter(exam => exam["Course"] && exam["Section"] &&
                      (exam["Mid Date"] || exam["Final Date"]) &&
                      exam["Start Time"] && exam["End Time"] && exam["Room."])
                .map(exam => {
                    const courseCode = exam["Course"];
                    const section = exam["Section"];
                    const dateField = exam["Final Date"] ? "Final Date" : "Mid Date";

                    // Collect unique course codes for suggestions
                    availableCourses.add(courseCode);

                    // Build course to sections mapping
                    if (!courseSections[courseCode]) {
                        courseSections[courseCode] = new Set();
                    }
                    courseSections[courseCode].add(section);

                    return {
                        date: utils.formatDateFromJSON(exam[dateField]),
                        time: utils.convertTimeFromJSON(exam["Start Time"], exam["End Time"]),
                        courseCode: courseCode,
                        section: section,
                        classroom: exam["Room."]
                    };
                });

            console.log("Loaded exam data:", examData.length, "entries");
            ui.showToast(`Loaded ${examData.length} exam entries successfully`, 'success');
        })
        .catch(error => {
            console.error('Error loading schedule data:', error);
            ui.showToast('Error loading schedule data. Please refresh the page.', 'error');
        });
}

/**
 * Find matching exams for a course code and section
 * @param {string} courseCode - The course code to search for
 * @param {string} section - The section to search for
 * @return {Array} - Array of matching exams
 */
function findExams(courseCode, section) {
    return examData.filter(exam =>
        exam.courseCode.toLowerCase() === courseCode.toLowerCase() &&
        exam.section === section
    );
}

/**
 * Get all available courses
 * @return {Array} - Array of course codes
 */
function getAvailableCourses() {
    return Array.from(availableCourses);
}

/**
 * Get all sections for a course
 * @param {string} courseCode - The course code
 * @return {Array} - Array of sections or empty array if course not found
 */
function getSectionsForCourse(courseCode) {
    if (courseSections[courseCode]) {
        return Array.from(courseSections[courseCode]);
    }
    return [];
}

/**
 * Check if the loaded data represents finals schedule
 * @return {boolean} - True if finals schedule, false for midterms
 */
function isFinalsScheduleLoaded() {
    return isFinalsSchedule;
}

// Export functions and data
window.data = {
    loadScheduleData,
    findExams,
    getAvailableCourses,
    getSectionsForCourse,
    isFinalsScheduleLoaded
};
