// data.js - Data loading and manipulation functions

// Store the exam data and course information globally
let examData = [];
let availableCourses = new Set();
let isFinalsSchedule = false; // Track if we're showing finals or midterms

// Course to sections mapping for quick lookups
let courseSections = {};

// Optional compatibility layer. The local file remains the fallback and
// existing deployments keep working if this endpoint is unavailable.
const EXAM_STATUS_URL = 'https://connect-cdn.itzmrz.xyz/exam_status.json';

function normalizeSemesterKey(value) {
    return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function getExamType(metadata) {
    return /final/i.test(String(metadata?.exam_name || metadata?.title || ''))
        ? 'final'
        : 'midterm';
}

async function loadConfirmedSchedule(localData) {
    const semesterKey = normalizeSemesterKey(localData?.metadata?.semester);
    const examType = getExamType(localData?.metadata);

    if (!semesterKey) return { data: localData, status: null };

    const fetchJson = async (url) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);
        try {
            const response = await fetch(url, {
                cache: 'no-store',
                signal: controller.signal
            });
            if (!response.ok) throw new Error(`request returned ${response.status}`);
            return response.json();
        } finally {
            clearTimeout(timeout);
        }
    };

    try {
        const status = await fetchJson(EXAM_STATUS_URL);
        const record = status?.semesters?.[semesterKey]?.[examType];
        if (!record?.confirmed || !record.dataUrl) {
            return { data: localData, status: record || null };
        }

        const officialData = await fetchJson(record.dataUrl);
        if (!officialData || !Array.isArray(officialData.exams)) {
            throw new Error('official schedule has an invalid exam_data shape');
        }

        return { data: officialData, status: record };
    } catch (error) {
        console.warn('Optional confirmed exam schedule unavailable; using local data:', error.message);
        return { data: localData, status: null };
    }
}

/**
 * Load schedule data from the JSON file
 * @return {Promise} - Promise that resolves when data is loaded
 */
async function loadScheduleData() {
    console.log("Fetching exam data...");
    try {
        const response = await fetch('exam_data.json');
        if (!response.ok) throw new Error('Network response was not ok');

        const localData = await response.json();
        const resolved = await loadConfirmedSchedule(localData);
        const data = resolved.data;
        const confirmation = resolved.status;

        if (confirmation?.confirmed) {
            console.log(`Using confirmed ${getExamType(data.metadata)} schedule from ${confirmation.source || 'official source'}`);
        }

        const metadata = data.metadata || {};

        try {
            ui.setScheduleStatus(
                confirmation?.confirmed
                    ? 'Official'
                    : confirmation
                        ? 'Tentative / Connect'
                        : 'Local PDF'
            );
        } catch (e) {
            console.warn('Failed to set schedule status label:', e);
        }

        try {
            ui.setLastUpdatedLabel(metadata.last_updated || metadata.generated_at || null);
        } catch (e) {
            console.warn('Failed to set last updated label:', e);
        }

        // Prefer explicit exam name + semester combo when provided
        if (metadata.exam_name && metadata.semester) {
            const combinedTitle = `${metadata.exam_name} ${metadata.semester}`.trim();
            try {
                ui.setCustomTitle(combinedTitle);
            } catch (e) {
                console.warn('Failed to set combined title from metadata:', e);
            }
        } else if (metadata.title) {
            try {
                ui.setCustomTitle(metadata.title);
            } catch (e) {
                console.warn('Failed to set custom title from metadata:', e);
            }
        } else if (data.exams && data.exams.length > 0) {
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

                availableCourses.add(courseCode);

                if (!courseSections[courseCode]) {
                    courseSections[courseCode] = new Set();
                }
                courseSections[courseCode].add(section);

                return {
                    date: utils.formatDateFromJSON(exam[dateField]),
                    time: utils.convertTimeFromJSON(exam["Start Time"], exam["End Time"]),
                    courseCode: courseCode,
                    section: section,
                    classroom: exam["Room."],
                    pageNumber: exam["Page Number"] || -1,
                    boundingBox: exam["BoundingBox"] || null
                };
            });

        console.log("Loaded exam data:", examData.length, "entries");
        ui.showToast(`Loaded ${examData.length} exam entries successfully`, 'success');
    } catch (error) {
        console.error('Error loading schedule data:', error);
        ui.showToast('Error loading schedule data. Please refresh the page.', 'error');
    }
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
