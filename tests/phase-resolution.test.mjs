// Regression tests for exam phase resolution (js/data.js).
//
// The bug these cover: once the first final exam day arrives, finalExamStartDate
// is no longer in the future, so getPhaseExamType() fell back to 'midterm'. The
// CDN exams.json is a finals-only payload, so adapting it with the midterm keys
// filtered every entry out: 0 entries, labelled "Tentative / Connect".
//
// Run: node tests/phase-resolution.test.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FIXTURES = path.join(ROOT, 'tests', 'fixtures');

const readFixture = name => JSON.parse(fs.readFileSync(path.join(FIXTURES, name), 'utf8'));

// The real CDN payloads carry the official Summer 2026 windows:
// midterm 2026-07-25..2026-08-02, finals 2026-09-12..2026-09-19.
const SUMMER_2026_WINDOWS = {
    midExamStartDate: '2026-07-25',
    midExamEndDate: '2026-08-02',
    finalExamStartDate: '2026-09-12',
    finalExamEndDate: '2026-09-19'
};

function fixedDate(isoDay) {
    const fixed = Date.parse(`${isoDay}T06:00:00Z`);
    return class FakeDate extends Date {
        constructor(...args) {
            if (args.length === 0) super(fixed);
            else super(...args);
        }
        static now() {
            return fixed;
        }
    };
}

function loadSite(nowIsoDay, payloads, uiCalls) {
    // `window` is the context's own global so that `utils`/`data` registered on
    // window resolve as bare globals, exactly like in the browser.
    const context = {};
    context.window = context;
    context.console = { log() {}, warn() {}, error() {} };
    context.setTimeout = setTimeout;
    context.clearTimeout = clearTimeout;
    context.AbortController = AbortController;
    context.Date = fixedDate(nowIsoDay);
    context.ui = new Proxy({}, {
        get: (_t, prop) => (...args) => uiCalls.push([prop, args])
    });
    context.fetch = async url => {
        const key = String(url);
        if (!(key in payloads)) throw new Error(`unexpected fetch: ${key}`);
        const body = payloads[key];
        return { ok: true, json: async () => JSON.parse(JSON.stringify(body)) };
    };

    vm.createContext(context);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', 'utils.js'), 'utf8'), context);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', 'data.js'), 'utf8'), context);

    // `let` bindings (examData, isFinalsSchedule) live in the context's global
    // lexical scope: visible to runInContext, not as properties of `context`.
    context.read = expr => vm.runInContext(expr, context);
    return context;
}

const localFallbackPayload = {
    metadata: { exam_name: 'Final Exam', semester: 'Summer-2026', total_entries: 3 },
    exams: []
};

function payloadSet(cdnExamsFixture) {
    return {
        'https://connect-cdn.itzmrz.xyz/status.json': readFixture('status.json'),
        'https://connect-cdn.itzmrz.xyz/exam_status.json': readFixture('exam_status.json'),
        'https://connect-cdn.itzmrz.xyz/exams.json': cdnExamsFixture,
        'exam_data.json': localFallbackPayload
    };
}

test('getPhaseExamType picks the phase whose official window contains today', () => {
    const site = loadSite('2026-09-13', {}, []);
    const { getPhaseExamType } = site;
    const now = new site.Date();

    const cases = [
        ['2026-07-01', 'midterm', 'before the midterm window'],
        ['2026-07-25', 'midterm', 'first midterm day'],
        ['2026-08-02', 'midterm', 'last midterm day'],
        ['2026-08-20', 'final', 'between the phases'],
        ['2026-09-12', 'final', 'first final day (the regression)'],
        ['2026-09-13', 'final', 'mid-finals today'],
        ['2026-09-19', 'final', 'last final day'],
        ['2026-09-25', 'midterm', 'after the finals']
    ];

    for (const [day, expected, label] of cases) {
        const metadata = { ...SUMMER_2026_WINDOWS };
        assert.equal(
            getPhaseExamType(metadata, new site.Date(`${day}T06:00:00Z`)),
            expected,
            `${label} (${day})`
        );
    }
    assert.equal(getPhaseExamType({ ...SUMMER_2026_WINDOWS }, now), 'final', 'real "now" of the test day');
});

test('getPhaseExamType treats finals-only metadata as the final phase', () => {
    const site = loadSite('2026-09-13', {}, []);
    const { getPhaseExamType } = site;
    const during = new site.Date('2026-09-14T06:00:00Z');

    assert.equal(
        getPhaseExamType({ finalExamStartDate: '2026-09-12', finalExamEndDate: '2026-09-19' }, during),
        'final',
        'no midterm dates at all'
    );
    assert.equal(
        getPhaseExamType({ midExamStartDate: '2026-07-25', finalExamStartDate: '2026-09-12', finalExamEndDate: '2026-09-19' }, during),
        'final',
        'midterm end date missing'
    );
});

test('during the finals window the site serves the official PDF payload', async () => {
    const uiCalls = [];
    const site = loadSite('2026-09-13', payloadSet(readFixture('exams.final-summer2026.json')), uiCalls);

    await site.data.loadScheduleData();

    assert.equal(site.window.examScheduleSource, 'official');
    assert.equal(site.window.examScheduleWarning, null);
    assert.equal(site.read('examData.length'), 3, 'finals entries must survive adaptation');
    assert.equal(site.read('isFinalsSchedule'), true);

    const statusLabels = uiCalls.filter(([fn]) => fn === 'setScheduleStatus').map(([, args]) => args[0]);
    assert.deepEqual(statusLabels, ['Official PDF']);

    const first = site.data.findExams('ACT201', '1')[0];
    assert.equal(first.date, '13-Sep-26');
    assert.equal(first.classroom, '09G-31T');
    assert.equal(first.pageNumber, -1, 'page mapping comes from exam_pages.json, not the CDN schema');
});

test('during the midterm window the site still serves the midterm payload', async () => {
    const uiCalls = [];
    const site = loadSite('2026-07-28', payloadSet(readFixture('exams.midterm-summer2026.json')), uiCalls);

    await site.data.loadScheduleData();

    assert.equal(site.window.examScheduleSource, 'fallback');
    assert.equal(site.read('examData.length'), 3);
    assert.equal(site.read('isFinalsSchedule'), false);
    const first = site.data.findExams('ACT201', '1')[0];
    assert.equal(first.date, '27-Jul-26');
});

test('after finals the site stops serving the finished finals payload', async () => {
    const uiCalls = [];
    const site = loadSite('2026-10-05', payloadSet(readFixture('exams.final-summer2026.json')), uiCalls);

    await site.data.loadScheduleData();

    // No official window contains today, so the stale finals payload (which has
    // no midterm dates) contributes nothing; the site waits for the next phase.
    assert.equal(site.window.examScheduleSource, 'fallback');
    assert.equal(site.read('examData.length'), 0);
    assert.equal(site.read('isFinalsSchedule'), false);
    assert.match(site.window.examScheduleWarning, /has not been confirmed by an official PDF/);
});
