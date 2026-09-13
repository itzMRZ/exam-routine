#!/usr/bin/env python3
"""One-off: capture small, real fixtures from the live CDN for the phase tests."""
import json
import pathlib
import urllib.request

OUT = pathlib.Path(__file__).resolve().parent.parent / "tests" / "fixtures"
OUT.mkdir(parents=True, exist_ok=True)


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "curl/8.9.1"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.load(resp)


exams = get("https://connect-cdn.itzmrz.xyz/exams.json")
status = get("https://connect-cdn.itzmrz.xyz/status.json")
exam_status = get("https://connect-cdn.itzmrz.xyz/exam_status.json")

final_fixture = {"metadata": exams["metadata"], "exams": exams["exams"][:3]}
# Same shape, but a midterm-phase payload (used for the midterm-window case).
mid_fixture = {
    "metadata": dict(exams["metadata"]),
    "exams": [
        {
            "courseCode": e["courseCode"],
            "sectionName": e["sectionName"],
            "sectionId": None,
            "sectionType": e.get("sectionType", "THEORY"),
            "midExamDate": "2026-07-27",
            "midExamTime": "11:00-13:00",
            "midExamRoom": "09G-31T",
            "midExamSource": "cdn",
            "finalExamDate": None,
            "finalExamTime": None,
            "finalExamRoom": None,
            "finalExamSource": None,
        }
        for e in exams["exams"][:3]
    ],
}

(OUT / "exams.final-summer2026.json").write_text(json.dumps(final_fixture, indent=2) + "\n")
(OUT / "exams.midterm-summer2026.json").write_text(json.dumps(mid_fixture, indent=2) + "\n")
(OUT / "status.json").write_text(json.dumps(status, indent=2) + "\n")
(OUT / "exam_status.json").write_text(json.dumps(exam_status, indent=2) + "\n")

print("metadata:", json.dumps(exams["metadata"], indent=2))
print("entries in live exams.json:", len(exams["exams"]))
print("status.currentSemesterKey:", status.get("currentSemesterKey"))
print("exam_status semesters:", json.dumps(exam_status.get("semesters"), indent=2))
