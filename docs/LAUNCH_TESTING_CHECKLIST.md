# Launch testing checklist (20–50 students)

Use this with a small cohort before a wider launch. Record what you observe. Do **not** invent production metrics.

## Cohort setup

- 20–50 real students (mix of hostel / day scholar if possible)
- EN / HI / GU speakers represented
- Mix of Android Chrome and iOS Safari at ~375px, plus a few laptops
- Light, Dark, and System theme each used by at least a few people
- Campus Circle stays **off** unless that cohort is explicitly opted into a flagged workspace

## Funnel (count people, not vanity rates)

1. **Signup completed** — account created without a support ping
2. **Onboarding completed** — college, course, semester, and money basics saved
3. **First useful action within 10 minutes** — any of: Study Buddy plan, assignment added, note saved, timetable slot, expense logged, or AI Tutor question
4. **Returned the next calendar day** — login + one study or money action
5. **Hit a blocker** — could not finish onboarding, could not log in, or abandoned after dashboard

## What to ask (plain language)

- Did onboarding feel like too many steps?
- Was “do now” / next deadline on the dashboard actually useful?
- Did Study Buddy recommend something that matched *your* subjects and deadlines?
- Did AI answers use your course/semester without inventing syllabus?
- Which feature did you open more than once: Study Buddy, assignments, notes, timetable, money, tutor?
- Where did you get stuck or want to quit?
- Any screen that overflowed, hid behind the keyboard, or had tiny tap targets on your phone?

## Errors and performance (observe, do not fabricate)

- Browser console errors on login, onboarding, dashboard
- Slow first dashboard load (note device + network, not a lab score)
- Failed saves (assignment, note, expense, profile)
- Logout then login still shows the same student data
- No other student’s notes, assignments, or money visible

## Privacy / safety spot-checks

- Avatar share text has no budget or rupee amounts
- Campus Circle is hidden in nav when the flag is off; `/dashboard/campus-circle` shows the disabled empty state
- Finance amounts only on money screens and the compact dashboard snapshot

## After the cohort

Write a short note: completion counts, top 3 useful features, top 3 abandonment points, and any recurring errors. Decide go / no-go from that note, not from estimates.
