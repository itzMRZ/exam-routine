// data.js - Data loading and manipulation functions

let examData = [];
let availableCourses = new Set();
let isFinalsSchedule = false;
let courseSections = {};

const EXAM_STATUS_URL = 'https://connect-cdn.itzmrz.xyz/exam_status.json';
const SEMESTER_STATUS_URL = 'https://connect-cdn.itzmrz.xyz/status.json';
const EXAMS_FALLBACK_URL = 'https://connect-cdn.itzmrz.xyz/exams.json';
const OFFICIAL_WINDOW_DAYS = 10;
const TRUSTED_SCHEDULE_HOSTS = new Set([
    'bracu-exam-routine.itzmrz.xyz',
    'connect-cdn.itzmrz.xyz'
]);

function normalizeSemesterKey(value) {
    return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function displaySemester(value) {
    const normalized = normalizeSemesterKey(value);
    const match = normalized.match(/^(spring|summer|fall)(\d{4})$/);
    return match ? `${match[1][0].toUpperCase()}${match[1].slice(1)} ${match[2]}` : String(value || 'Unknown');
}

function getExamType(metadata) {
    return /final/i.test(String(metadata?.exam_name || metadata?.title || ''))
        ? 'final'
        : 'midterm';
}

function parseIsoDate(value) {
    if (!value) return null;
    const date = new Date(`${value}T00:00:00Z`);
    return Number.isNaN(date.getTime()) ? null : date;
}

function daysUntil(value, now = new Date()) {
    const target = parseIsoDate(value);
    if (!target) return null;
    const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    return Math.ceil((target.getTime() - today) / 86400000);
}

function getPhaseExamType(metadata, now = new Date()) {
    const midEnd = daysUntil(metadata?.midExamEndDate, now);
    const finalStart = daysUntil(metadata?.finalExamStartDate, now);

    if (midEnd !== null && midEnd < 0 && (finalStart === null || finalStart >= 0)) {
        return 'final';
    }

    return 'midterm';
}

function isNearExam(metadata, examType, now = new Date()) {
    const dateKey = examType === 'final' ? 'finalExamStartDate' : 'midExamStartDate';
    const distance = daysUntil(metadata?.[dateKey], now);
    return distance !== null && distance <= OFFICIAL_WINDOW_DAYS;
}

async function fetchJson(url) {
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
}

function splitTime(value) {
    const text = String(value || '').trim();
    if (!text) return ['', ''];
    const parts = text.split(/\s*-\s*/);
    return [parts[0] || '', parts[1] || parts[0] || ''];
}

function adaptCdnSchedule(payload, examType) {
    if (!payload || !Array.isArray(payload.exams)) {
        throw new Error('CDN fallback has an invalid exams shape');
    }

    const dateKey = examType === 'final' ? 'finalExamDate' : 'midExamDate';
    const timeKey = examType === 'final' ? 'finalExamTime' : 'midExamTime';
    const exams = payload.exams
        .filter(exam => exam?.courseCode && exam?.sectionName && exam?.[dateKey])
        .map(exam => {
            const [start, end] = splitTime(exam[timeKey]);
            return {
                Course: exam.courseCode,
                Section: String(exam.sectionName),
                [examType === 'final' ? 'Final Date' : 'Mid Date']: exam[dateKey],
                'Start Time': start,
                'End Time': end,
                'Room.': exam.finalExamRoom || exam.midExamRoom || 'TBA',
                'Section ID': exam.sectionId,
                'Section Type': exam.sectionType
            };
        });

    const semester = payload.metadata?.semester || payload.metadata?.currentSemester || 'Unknown';
    const examName = examType === 'final' ? 'Final Exam' : 'Midterm Exam';
    return {
        metadata: {
            exam_name: examName,
            semester: displaySemester(semester),
            title: `${examName} ${displaySemester(semester)}`,
            last_updated: payload.metadata?.lastUpdated || null,
            source: 'connect-fallback',
            sources: payload.metadata?.sources || {}
        },
        exams
    };
}

function normalizeOfficialUrl(value) {
    const url = new URL(value, window.location.href);
    if (url.protocol !== 'https:' || !TRUSTED_SCHEDULE_HOSTS.has(url.hostname)) {
        throw new Error(`official schedule host is not trusted: ${url.hostname}`);
    }
    return url.href;
}

async function resolveSchedule(localData) {
    let semesterStatus = null;
    let confirmationStatus = null;
    let cdnData = null;

    try {
        [semesterStatus, confirmationStatus, cdnData] = await Promise.all([
            fetchJson(SEMESTER_STATUS_URL).catch(() => null),
            fetchJson(EXAM_STATUS_URL).catch(() => null),
            fetchJson(EXAMS_FALLBACK_URL).catch(() => null)
        ]);

        const currentSemesterKey = normalizeSemesterKey(
            semesterStatus?.currentSemesterKey || cdnData?.metadata?.currentSemester || localData?.metadata?.semester
        );
        const examType = getPhaseExamType(cdnData?.metadata || localData?.metadata || {});
        const fallbackData = cdnData ? adaptCdnSchedule(cdnData, examType) : null;
        const mergedSource = cdnData?.metadata?.sources?.[examType] || null;
        const record = confirmationStatus?.semesters?.[currentSemesterKey]?.[examType] || null;
        const nearExam = isNearExam(cdnData?.metadata || {}, examType);

        if (fallbackData && mergedSource?.source === 'pdf' && mergedSource.confirmed) {
            return {
                data: fallbackData,
                source: 'official',
                sourceLabel: 'Official PDF',
                warning: null,
                examType,
                semesterKey: currentSemesterKey,
                status: mergedSource
            };
        }

        if (fallbackData && mergedSource?.source === 'mixed') {
            return {
                data: fallbackData,
                source: 'fallback',
                sourceLabel: 'Mixed PDF / Connect',
                warning: 'This routine contains fallback Connect entries and has not been fully confirmed by an official PDF. Do not use it for your exam.',
                examType,
                semesterKey: currentSemesterKey,
                status: mergedSource
            };
        }

        if (record?.confirmed && record.dataUrl && nearExam) {
            const officialData = await fetchJson(normalizeOfficialUrl(record.dataUrl));
            if (!officialData || !Array.isArray(officialData.exams)) {
                throw new Error('official schedule has an invalid exam_data shape');
            }
            return {
                data: officialData,
                source: 'official',
                sourceLabel: 'Official PDF',
                warning: null,
                examType,
                semesterKey: currentSemesterKey,
                status: record
            };
        }

        if (fallbackData) {
            return {
                data: fallbackData,
                source: 'fallback',
                sourceLabel: 'Tentative / Connect',
                warning: 'This routine is fallback data from Connect and has not been confirmed by an official PDF. Do not use it for your exam.',
                examType,
                semesterKey: currentSemesterKey,
                status: record
            };
        }
    } catch (error) {
        console.warn('Current CDN/official resolution failed:', error.message);
    }

    const localSemesterKey = normalizeSemesterKey(localData?.metadata?.semester);
    const localExamType = getExamType(localData?.metadata);
    return {
        data: localData,
        source: 'local-fallback',
        sourceLabel: 'Local fallback',
        warning: 'This routine is local fallback data and has not been confirmed for the current exam. Do not use it for your exam.',
        examType: localExamType,
        semesterKey: localSemesterKey,
        status: null
    };
}

/** Load the current phase schedule, preferring CDN fallback or confirmed PDF. */
async function loadScheduleData() {
    console.log('Fetching exam data...');
    try {
        const response = await fetch('exam_data.json', { cache: 'no-store' });
        if (!response.ok) throw new Error('Network response was not ok');

        const localData = await response.json();
        const resolved = await resolveSchedule(localData);
        const data = resolved.data;
        const metadata = data.metadata || {};
        isFinalsSchedule = resolved.examType === 'final';
        window.examScheduleSource = resolved.source;
        window.examScheduleWarning = resolved.warning;

        if (resolved.status?.confirmed) {
            console.log(`Using confirmed ${resolved.examType} schedule from ${resolved.status.source || 'official source'}`);
        }

        try {
            ui.setLastUpdatedLabel(metadata.last_updated || metadata.generated_at || null);
            ui.setScheduleStatus(resolved.sourceLabel);
            ui.setDataWarning(resolved.warning);
        } catch (e) {
            console.warn('Failed to update schedule source UI:', e);
        }

        if (metadata.exam_name && metadata.semester) {
            ui.setCustomTitle(`${metadata.exam_name} ${metadata.semester}`.trim());
        } else if (metadata.title) {
            ui.setCustomTitle(metadata.title);
        } else {
            ui.updateTitle(isFinalsSchedule);
        }

        examData = (Array.isArray(data.exams) ? data.exams : [])
            .filter(exam => exam.Course && exam.Section &&
                (exam['Mid Date'] || exam['Final Date']) &&
                exam['Start Time'] && exam['End Time'])
            .map(exam => {
                const courseCode = exam.Course;
                const section = String(exam.Section);
                const dateField = exam['Final Date'] ? 'Final Date' : 'Mid Date';

                availableCourses.add(courseCode);
                if (!courseSections[courseCode]) courseSections[courseCode] = new Set();
                courseSections[courseCode].add(section);

                return {
                    date: utils.formatDateFromJSON(exam[dateField]),
                    time: utils.convertTimeFromJSON(exam['Start Time'], exam['End Time']),
                    courseCode,
                    section,
                    classroom: exam['Room.'] || 'TBA',
                    pageNumber: exam['Page Number'] || -1,
                    boundingBox: exam.BoundingBox || null
                };
            });

        console.log('Loaded exam data:', examData.length, 'entries');
        ui.showToast(`Loaded ${examData.length} exam entries successfully`, 'success');
    } catch (error) {
        console.error('Error loading schedule data:', error);
        ui.showToast('Error loading schedule data. Please refresh the page.', 'error');
    }
}

function findExams(courseCode, section) {
    return examData.filter(exam =>
        exam.courseCode.toLowerCase() === courseCode.toLowerCase() &&
        exam.section === section
    );
}

function getAvailableCourses() {
    return Array.from(availableCourses);
}

function getSectionsForCourse(courseCode) {
    return courseSections[courseCode] ? Array.from(courseSections[courseCode]) : [];
}

function isFinalsScheduleLoaded() {
    return isFinalsSchedule;
}

window.data = {
    loadScheduleData,
    findExams,
    getAvailableCourses,
    getSectionsForCourse,
    isFinalsScheduleLoaded
};