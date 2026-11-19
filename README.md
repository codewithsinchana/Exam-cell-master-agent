# Exam Cell Master Agent

A single-command exam planner for the Department of Computer Science and Engineering (Cyber Security), Dayananda Sagar College of Engineering.

Type **"Plan the CIE-2 for 5th sem"** and it produces the timetable, seating arrangement, invigilation duty chart and every printable form.

## Run it

1. Unzip the folder.
2. Open `index.html` in any modern browser (Chrome, Edge, Firefox). No server, install or internet connection is needed, except that the Google Fonts load online.

## Files

| File | Purpose |
|---|---|
| `index.html` | Page structure |
| `style.css` | Design, print styles and paper layout |
| `app.js` | The agent logic: schedule, seating, duty, forms |
| `assets/logo.png` | College logo shown on printed forms (replace it, or upload a logo in the Setup panel) |
| `docs/reference-timetable.png` | The issued CIE-2 timetable this project is preloaded with |

## Preloaded CIE-2 timetable (5th sem, November 2026)

| Date | 9.15 am – 10.45 am | 1.45 pm – 3.15 pm |
|---|---|---|
| 03-11-2026 | Software Engineering (22CY51) | Computer Network and Security (22CY52) |
| 04-11-2026 | Essentials of Cyber Security (22CY53) | Artificial Intelligence in Cyber Security (22CY551) |
| 05-11-2026 | Research Methodology and IPR (22RM56) | — |

To change it, open **Exam cell setup** and edit the Timetable box. One paper per line:

```
DD-MM-YYYY | FN or AN | CODE - Subject name
```

## What the agent produces

- **Schedule:** the timetable in the department's own format, plus a paper-wise table.
- **Seating:** room-wise bench layouts for each paper, rotated per paper, with a USN finder.
- **Duty chart:** two invigilators per room, a reliever and a flying squad per paper, a fairness meter and CSV export.
- **Forms:** time table notice, circular, attendance sheet, faculty duty order, hall ticket and absentee statement. Each prints cleanly with the college letterhead.

## Notes

- The faculty names, USN prefix (`1DS24CY`), class strength (60), Chief Superintendent, HOD and Coordinator names are placeholders. Edit them in the Setup panel.
- Other semesters and CIE-1 / CIE-3 get an auto-generated timetable (two papers a day, Sundays skipped) that you can edit.
- Everything runs in the browser and nothing is uploaded anywhere.
