# StudentLife AI — AI User Feedback Lab Report

**Live product tested:** https://studentlife-ai.vercel.app  
**Test date:** 18 September 2026  
**Method:** Browser-only use of the live UI. No source-code navigation, no code edits, no bugfixes.  
**Evidence:** Live clicks, page copy, and screenshots from the Cursor browser session.

**Session notes (honesty):**
- First “Create a free account” click while a previous browser session was still signed in dumped the tester onto `/dashboard` as `demoabdaistudio@gmail.com` (display name “there”). That is a real first-visit failure.
- After Sign out, a **new account was actually registered** (`panel.studentlife.918@gmail.com`, display name Aarav) and onboarding was completed.
- In-app tasks (dashboard, Study Buddy, assignments, exam/emergency plan, AI Tutor, money, games, Class Hub, languages, mobile) were run on that new account unless noted.
- Separate brand-new accounts were **not** created for all 10 personas. Personas below are independent *judgments* of the same live product, with a real first-time signup performed once.

---

## 1. Executive summary

To a new student, StudentLife AI currently feels like a **dark, polished marketing site attached to an overloaded student OS**.

The landing headline is understandable: study, deadlines, and budget in one place. After login, that clarity collapses. The app greets a first-time user with “Welcome back”, a 20+ item sidebar, XP/Aura/quests, a money health score, and a “Do now” that is often a **gamification chore** (“Add or complete one assignment task”) rather than a real academic next step.

The product **does** contain useful pieces: Study Buddy can name a subject, Emergency Plan produced a concrete “Do now: DBMS project report, 45 min” after a deadline existed, expenses logging is simple, and Safe Spend is a real number. Those pieces are buried, split across similarly named pages, and undermined by trust failures — especially **AI Tutor returning the internal prompt/context dump instead of teaching**.

A first-time student would not feel they found “the one app for student life.” They would feel they found a demo of many apps.

---

## 2. First 5-second test

**Immediate understanding**
- This is for students.
- It combines studying, deadlines, and money.
- There is a free plan and a primary “Create a free account” button.
- The right-hand card looks like a real workspace (streak, XP, assignment, quests).

**Not understood in 5 seconds**
- Whether the right-hand dashboard is **sample data** (tiny label: “Example workspace preview · sample data”) or the actual product they will get.
- What to do first besides create an account.
- Difference between AI Tutor, Study Buddy, Assignment Helper, Exam Prep, Emergency Plan.
- Why Academic Aura exists.
- What the product is *not* (not just ChatGPT, not a bank, not a social network).

**Visual 5-second problems**
- Top nav is overcrowded. On a typical laptop crop, **“Resources” is clipped**. Product / AI Tutor / Exam Prep / Budget dropdowns compete with Log in and Create account.
- Hero tries to sell everything at once. A confused 18-year-old gets “this is a lot,” not “this solves my problem.”

**Verdict:** Value proposition is *partially* clear in 5 seconds. Product identity is not. Many students would bounce because it looks like a long SaaS landing page, not a tool they can start using immediately.

---

## 3. Persona results

### 1. First-time confused student (18–20, low patience)

- **First impression:** Pretty dark campus photo + too many nav items. Feels like a startup landing page.
- **What they think it is:** “Some AI study + money app for college.”
- **First click:** Create a free account (hero). When already logged in from a previous session, they never saw signup — they landed in someone else’s / a leftover dashboard named “there.” After sign-out, signup worked.
- **Navigation obvious?** Signup yes. After login, no. Sidebar is a textbook.
- **Clicks to a usable “aha”:** ~8–12 (signup 3 steps + onboarding form + dashboard stare + guess Study Buddy).
- **Confusion:** Onboarding asks college, course, semester, subjects, pocket money, student type, primary goal, AI language, personality **on one long form**. Personality modes on a first-run form feel like a joke, not setup.
- **Dead ends:** Dashboard “Do now” is “add an assignment” before they know why.
- **Would abandon:** Yes, after the dashboard. Too much chrome, no one job.

### 2. Normal college student (assignments, exams, daily study)

- **First impression:** Could replace a mix of calendar + notes if it actually tracks work.
- **What they think it is:** Academic planner with AI bolted on.
- **First click after login:** Assignments or Study Buddy (sidebar labels help a bit: “Deadlines”, “What to study now”).
- **Friction:** Assignments page is a **bare form** (title, subject, ISO date). Creating “DBMS project report” due 2026-09-21 worked. Finding it again worked. Urgency is weak: `DBMS · due 2026-09-21 · PENDING` — no “3 days left”, no marks, no time estimate.
- **Assignment Helper** is a different page with a huge generate-draft form. The assignment they just created is **not** sitting there to help with.
- **Would keep using?** Only if they already like filling trackers. Otherwise Google Calendar + ChatGPT is less work.

### 3. Exam-panic student

- **First impression:** Landing promises catch-up plans and papers. Good.
- **First click:** Exam Prep (sidebar: “Revision hub”).
- **What they got:** A **directory of other features** (Question papers, AI Tutor, Emergency plan, Exams calendar, Focus Sprint, Notes). “Manage exams” did not take them to a calendar in this session (click stayed on the hub).
- **Emergency Plan** (separate nav item) **did** produce value after an assignment existed: Do now = start DBMS project report, 45 min, outline → draft → check; later = light revision; sleep protected. That is the closest thing to “tell me what to do now.”
- **Study Buddy during panic with no exam dated:** “C Programming / No urgent deadline. Review this subject you already added.” Useless under panic.
- **Would abandon:** If they only open Exam Prep. If they stumble into Emergency Plan, they might stay 10 more minutes.

### 4. Non-tech student

- **Navigation:** Not obvious. Two assignment products. Two AI chats (AI Tutor vs Study Buddy ask box). Budget nav says “Pocket money” but the page is **category limits**.
- **Wording:** XP, Aura, Campus Bro, Chronically Online, Academic Villain, GUIDED DRAFT (all caps in a dropdown).
- **Onboarding:** Too many fields. “Day scholar” vs “Hostel” is fine; “App personality” is not.
- **Would abandon:** High. They need 5 buttons, not 24.

### 5. Gen-Z skeptical user

- **5-second judgment:** Landing is competent but generic “AI SaaS.” Sample dashboard with 7-day streak and ₹122 Safe today looks **staged**.
- **Fake / AI-generated feel:** Personality tab names (Campus Bro, Academic Villain, Chronically Online). “Built with student feedback” is three bullets that are feature requests, explicitly *not* testimonials — honest, but empty. Language picker lists 20+ languages as **Coming soon**.
- **Trust killer:** AI Tutor spat `LANGUAGE RULE (mandatory)` and a fenced `Your saved context` block. Looks like a broken demo.
- **Would leave:** Immediately after AI Tutor, or after seeing Aura 50/100 for doing nothing.

### 6. Money-focused student

- **Onboarding:** Pocket money defaulted to ₹5,000. **No field for necessary expenses ₹2,000.**
- **Dashboard:** Money left ₹5,000, Safe per day **₹384.61** (5000÷13 days). Ugly decimals. Formula is shown (“Money left ÷ days left”). Does **not** reserve necessities.
- **Health:** Money Dashboard showed Health score **61 / Fair** with ₹0 spent — confusing. After logging Lunch ₹120 (Food), remaining became ₹4,880, safe ~₹375.38.
- **Where to add expenses:** Sidebar “Expenses / Log spending” — actually easy once found. Privacy line “only you can see it” is good.
- **Budget page:** Category monthly limits, not pocket money. Set Food ₹2,000 as a stand-in for “necessary.” That is not the same as “₹2,000 already committed this month.”
- **Would they understand Safe Spend?** They would understand the *arithmetic*. They would **not** trust it as “what I can spend today after rent/food/travel.”

### 7. AI-Tutor user

- **Asked (verbatim):** “Explain pointers in C programming like I am a beginner.”
- **Got:** A “Study help” card with a suggested 4-step approach, then **the model’s instructions and student context**, including institution, subjects, pending assignment, and “Do not fabricate citations.”
- **Follow-up:** “Give an Example” produced the same dump with `Apply mode: Give an Example`.
- **Usefulness:** None for learning pointers.
- **Integration:** Looks like a generic chat shell (conversations list, New chat, mode chips) that failed to call a real tutor.
- **Would they use ChatGPT instead?** Yes, instantly.

### 8. Mobile-first user (~375px)

- Viewport confirmed `375×812`.
- Dashboard **does** collapse the sidebar into a hamburger (“open navigation”).
- **Problems:** Top chrome is dense (menu, title, theme, bell, settings, avatar). Opening the drawer shows the **same endless STUDY/MONEY/ACCOUNT list**. Content remains visible underneath; the Aarav chip overlaps the drawer in the screenshot.
- Gujarati UI on a small screen = dense text + mixed English buttons (“Study Buddy ખોલો”).
- Landing at desktop already clips nav; on a phone it would be worse (not fully re-walked as a logged-out 375px first-run after language switch).
- **Would use daily on phone?** Unlikely. Too much scrolling, too many destinations, no thumb-first “today” strip.

### 9. Multilingual student (EN / HI / GU)

- Signup has EN / हि / ગુ radios — good discovery.
- Settings splits **UI language** vs **AI explanation language** — conceptually correct, poorly explained for a first-timer.
- **English:** Fine, slightly corporate.
- **Hindi:** Partial. Sidebar mix: `AI Tutor कुछ भी पूछो`, `Study Buddy अभी क्या पढ़ें`, English privacy sentences left untranslated (`We protect your personal data…`).
- **Gujarati:** Settings heading `સેટિંગ્સ` works. Study Buddy subtitle **`હવે શું વાંચવું`** = “what to *read* now,” not “what to study.” Quests stayed English: `Study C Programming for 25 minutes`. `Getting started` untranslated. Product names left in English.
- Language menu advertises Urdu, Bengali, Tamil, Arabic, Spanish, Chinese, Japanese, etc. as Coming soon — looks unfinished.

### 10. Returning daily user

- After one session: streak 1, 50 XP, Aura 52, 1/3 quests, “today’s study complete / streak safe” (Gujarati dashboard).
- **Reason to return tomorrow:** Streak guilt, maybe. Not a compelling academic hook. No exam on the calendar. Assignment already marked SUBMITTED. Study Buddy will say “no urgent deadline” again unless they keep feeding data.
- **Would return?** Weak maybe. Streaks without real study consequence feel like Duolingo without the language payoff.

---

## 4. Feature feedback

### Landing
Clear headline. Overloaded nav. Sample workspace looks like a live product (trust mix). Pricing admits Pro billing is not live — honest, also makes the product feel pre-launch. “Join waitlist via signup” wording on a live signup product is contradictory.

### Onboarding
**Worked.** Email + password → name → confirm → `/onboarding` academic form → dashboard. Password rules were visible.  
**Failed as a human experience:** too much on one page; personality; no necessary-expenses; no “pick your first job” (study vs money vs exam). Primary goal defaulted to money even for a study-heavy student.

### Dashboard
First-run copy is wrong: **Welcome back**. Empty-state “Do now” is a quest, not a goal. Budget “looks comfortable” with zero transactions is empty calories. Share card before the user has anything to share. Too many widgets (streak, XP, aura, quests, money, quick actions).

### Study Buddy
Best-labeled feature (“What to study now”). Recommendation with only subjects: generic C Programming, 25 min. “Build today’s plan” restated the same line. Session is “in progress” **without a visible countdown**; “Mark session complete” can be pressed immediately — streak/XP without studying. History saved a plan title, not a real study record. Ask box duplicates AI Tutor.

### Assignments
Create / find / mark done: **works**, minimal. Date picker defaults to **today** even when you intend +3 days (easy to mess up). Status after “Mark done” became **SUBMITTED** — wrong word for homework. No urgency UI. Not linked to Assignment Helper or Exam Prep.

### Exam Prep
A link farm, not prep. Panic students need a plan, not six cards. Emergency Plan (elsewhere) is the actual exam-panic feature and should *be* Exam Prep’s first screen.

### AI Tutor
**Broken in this live test.** Prompt/context leakage. No pointers explanation. Follow-up modes also leaked. Looks like a chatbot template, not a tutor that knows B.Tech CSE Sem 3.

### Money / Safe Spend
Expense log is the most understandable money UI. Safe Spend is a simple remaining÷days number with cents. No “necessary ₹2,000.” Health score 61 with no spend. Budget ≠ pocket money. Many money sub-pages (coach, goals, afford, reports) were not needed to answer “how much can I spend today?” and increase confusion.

### Gamification
Quests show **Complete · + XP** as if claiming is the product. Copy elsewhere says XP is for meaningful activity. Streak moved after a short marked session. Aura 50→52 is meaningless. Leaderboard is opt-in and empty — fine for privacy, dead as a social loop.

### Campus / social
Class Hub: empty join form, **did not prefill** Sample University / B.Tech CSE / Sem 3 from onboarding. Privacy sentence is actually good (announcements unverified; private tasks/money/grades not shared). Reason to use it is not obvious if no classmates are there. Leaderboard hidden by default.

### Profile / settings
Huge. Avatar themes (Aurora, Ember, …), selfie, status (Grinding), personality, two language pickers, eight notification toggles. Sign out is buried at the bottom — we found it, a student on a shared PC might not. “Edit profile & pocket money” is a separate link from the Budget page.

### Mobile
Hamburger exists. Nav still has every desktop item. Header collision. No simplified today view. Language + mobile together is heavy.

### Languages
EN usable. HI/GU mixed, some wrong verbs, legal/privacy often English. Coming-soon language list hurts credibility.

---

## 5. Critical issues

### BLOCKER — AI Tutor does not teach; it leaks the system prompt
- **Where:** `/dashboard/ai-tutor` after “Explain pointers in C programming like I am a beginner.”
- **Persona:** AI-Tutor user, Gen-Z skeptic, any student who came for help.
- **Evidence:** On-screen “Your saved context ``` Institution: Sample University … LANGUAGE RULE (mandatory): Respond in English…” Screenshot: `ai-tutor-leaked-prompt.png`. Follow-up “Give an Example” repeated the dump.
- **Expected:** A beginner explanation of pointers, then a worked example.
- **Why it matters:** This is the headline feature. A broken tutor sends users to ChatGPT permanently and makes the product look unsafe/unfinished.

### BLOCKER — First visit can skip signup and open an existing session
- **Where:** Landing → Create a free account while another account is still signed in.
- **Persona:** First-time student on a shared/family browser.
- **Evidence:** Navigation went to `/dashboard` for `demoabdaistudio@gmail.com`, name “there” / Settings “Name: Not set”.
- **Expected:** Signup, or a clear “You’re signed in as X — continue or switch account.”
- **Why it matters:** Privacy, confusion, and “this app is haunted” abandonment.

### HIGH — Dashboard does not tell a new user what to do
- **Where:** `/dashboard` immediately after onboarding.
- **Persona:** Confused student, non-tech, normal student.
- **Evidence:** “Welcome back”, “Add or complete one assignment task”, Aura 50, Share card, 24 sidebar links.
- **Expected:** One primary next step based on the goal they just chose.
- **Why it matters:** Day-0 drop-off.

### HIGH — Safe Spend ignores committed / necessary expenses
- **Where:** Dashboard + `/dashboard/money`. Pocket money ₹5,000, 13 days left → ₹384.61/day.
- **Persona:** Money-focused student.
- **Evidence:** Onboarding has pocket money only. No necessary ₹2,000. After ₹120 lunch, remaining ₹4,880 ÷ 13 ≈ ₹375.38.
- **Expected:** Safe today after bills/food they already know they must pay.
- **Why it matters:** The money feature’s only unique promise is wrong for real student budgets.

### HIGH — Information architecture: too many overlapping products
- **Where:** Sidebar: AI Tutor vs Study Buddy; Assignments vs Assignment Helper; Exam Prep vs Emergency Plan vs Question Generator vs Games Focus Sprint.
- **Persona:** Non-tech, confused, exam-panic (clicked the wrong hub).
- **Evidence:** Exam Prep is cards linking out; Emergency Plan is where the plan actually generated.
- **Expected:** One study home, one deadlines home, one money home.
- **Why it matters:** Students cannot form a habit in a maze.

### HIGH — Study session can be completed without studying
- **Where:** Study Buddy “Start study session” → “Mark session complete” with no timer UI.
- **Persona:** Daily user, Gen-Z (calls it fake), exam-panic (wants real work).
- **Evidence:** Session “C Programming · 25 min” + complete button; later streak 1 / XP 50.
- **Expected:** A real 25-minute timer, or don’t award streak for an instant mark.
- **Why it matters:** Gamification becomes a lie.

### MEDIUM — Assignment urgency and status language
- **Where:** `/dashboard/assignments`
- **Evidence:** `due 2026-09-21 · PENDING`; “Mark done” → `SUBMITTED`. Default due date was today (`2026-09-18`) before we overwrote it.
- **Expected:** “Due in 3 days”, status Done/In progress, not SUBMITTED unless they submitted to a teacher.
- **Why it matters:** Deadlines are the reason to open the app.

### MEDIUM — Exam Prep is not exam prep
- **Where:** `/dashboard/exam-prep`
- **Persona:** Exam-panic.
- **Evidence:** Hub copy only; Manage exams click did not change page in this run.
- **Expected:** Upcoming exam + what to study today.
- **Why it matters:** Panic users have no patience for a sitemap.

### MEDIUM — Nav overflow and sample-data ambiguity on landing
- **Where:** https://studentlife-ai.vercel.app/
- **Evidence:** Screenshot with clipped “Reso”. Sample dashboard looks live.
- **Expected:** 3–4 nav items; sample clearly framed as a mock.
- **Why it matters:** First 5 seconds.

### MEDIUM — Translations mixed and sometimes wrong
- **Where:** Settings UI language Hindi/Gujarati; mobile dashboard in Gujarati.
- **Evidence:** `હવે શું વાંચવું`; English quests; English privacy; `Getting started` untranslated.
- **Expected:** Consistent GU/HI including nav or don’t claim the language.
- **Why it matters:** Multilingual students feel the app is English with a filter.

### MEDIUM — Mobile nav is desktop nav in a drawer
- **Where:** 375×812 dashboard.
- **Evidence:** Hamburger opens 20+ links; header overlap.
- **Expected:** Today / Study / Money / Me.
- **Why it matters:** Phone is the primary student device.

### LOW — Cosmetic / gimmick
- Personality modes as a first-class landing section.
- Aura number with no meaning.
- Share card on day 0.
- 16 avatar theme radios.
- Language list of 20 coming-soon locales.

### LOW — Class Hub empty and not prefilled
- Join form blank despite onboarding college/course/semester.
- Empty community is fine; making the user retype is not.

---

## 6. Confusion map

| Place | What happened |
| --- | --- |
| Landing Create account while session exists | Expected signup; got another user’s dashboard |
| Landing nav | Hesitated among Product, AI Tutor, Assignments, Exam Prep, Games, Budget |
| Signup left panel | Screenshots/crops are dominated by stock campus photo; form lives on the right |
| Onboarding personality | Could not predict why this is required to start studying |
| Dashboard “Do now” | Thought it was the AI plan; it was a quest to add a task |
| Dashboard “Welcome back” | Thought they had used the app before |
| Study Buddy vs AI Tutor | Two places to ask questions |
| Study Buddy “Start session” | Expected a timer; got a flag + complete button |
| Assignments vs Assignment Helper | Created a deadline in one; draft generator in the other with empty fields |
| Exam Prep vs Emergency Plan | Clicked Exam Prep for panic; plan lived under Emergency |
| Manage exams | Click did nothing visible |
| Budget vs Expenses vs Money Dashboard vs Profile pocket money | Four places that sound like “my money” |
| Budget nav “Pocket money” | Page is category limits |
| Mark done | Became SUBMITTED |
| AI Tutor mode chips | Expected a better answer; got another prompt leak |
| Settings language vs explanation language | Two English buttons; easy to change the wrong one |
| Language picker | Overwhelmed by Coming soon list |
| Mobile hamburger | Found nav, then the same endless list |

---

## 7. Best features (actual value observed)

1. **Emergency catch-up plan** — After a real assignment existed, it produced a now/later schedule with time boxes and sleep protection, and said it added a timetable session.
2. **Expense logging** — Amount, date, category, note, Save. Totals updated. Privacy copy is clear.
3. **Safe Spend as a visible number** — Even if the formula is naive, students can see “₹X today.”
4. **Study Buddy naming** — “What should I study now?” is the right question. It did pick a saved subject (C Programming).
5. **Signup basics** — Email/password rules, no credit card, language radios on the auth screen.
6. **Class Hub privacy disclaimer** — Rare honesty: user-submitted, unverified; money/grades not shared.
7. **Leaderboard default private** — Correct default.

---

## 8. Features that feel weak / unnecessary

- Academic Aura
- Personality modes (Campus Bro, Academic Villain, Chronically Online) as a product pillar
- Share/weekly recap cards before the user has a week
- 16 avatar palettes + selfie on Settings
- Separate Assignment Helper vs Assignments
- Exam Prep as a hub of links
- Question Generator / Flashcard Flip / Quiz Rush as peer-level nav items before the core loop works
- Language mega-menu of Coming soon locales
- Health score 61 with no data
- Duplicate AI ask boxes

Do not protect these. They dilute the few things that work.

---

## 9. Trust / professionalism review

| Signal | Why it hurts |
| --- | --- |
| AI Tutor prompt leak | Looks amateur and possibly careless with internals |
| Display name “there” / Name not set on leftover session | Unfinished |
| Sample landing stats (7-day streak, Aura 82) vs empty real account | Demo-like bait |
| Welcome back on first dashboard | Sloppy |
| SUBMITTED vs Mark done | Unprofessional copy |
| ₹384.61 | Looks like a spreadsheet, not a product |
| GUIDED DRAFT in caps | Dev leftover vibe |
| “Pro payments not enabled yet” + waitlist link | Pre-launch, not a finished student tool |
| Stock campus photography vs “your college” | Generic AI-startup aesthetic |
| Mixed HI/GU + English legal text | Unfinished localization |
| Honest “not testimonials” block that still sits in a social-proof slot | Awkward |

Privacy/security lines about not being a bank and not selling data **help** trust — if the rest of the UI did not look like a prototype.

---

## 10. Competitive reaction

**Why would I use StudentLife AI instead of ChatGPT + Calendar + Notes?**

Today: **I would not**, except maybe to log expenses and generate an emergency plan *if* I already typed my deadlines in.

- ChatGPT (this test) actually explained pointers. StudentLife’s tutor showed me its homework.
- Google Calendar shows “due in 3 days” without a 24-item sidebar.
- Notes apps store the syllabus StudentLife kept asking me to upload.
- The only unique combination — study plan + safe spend + streak — is not trustworthy enough: spend ignores necessities; streaks can be marked complete; the plan is generic without exams.

The *idea* of one workspace is the only competitive argument, and the workspace is not simple enough to beat three apps the student already has.

---

## 11. Retention test (return tomorrow?)

| Persona | Return? | Why / why not |
| --- | --- | --- |
| First-time confused | **No** | Dashboard overload, no obvious win |
| Normal college | **Maybe** | Only if they commit to logging every assignment; current assignment UI is thinner than Calendar |
| Exam-panic | **Yes, briefly** | If they found Emergency Plan and have an exam this week; Exam Prep hub alone: no |
| Non-tech | **No** | Too many labels and pages |
| Gen-Z skeptic | **No** | Fake-feeling gamification + broken tutor |
| Money-focused | **Maybe** | Expense log is easy; Safe Spend is not believable yet |
| AI-Tutor user | **No** | Tutor failed the one job |
| Mobile-first | **No** | Drawer of the desktop IA |
| Multilingual | **No** | Mixed language feels careless |
| Returning daily | **Weak maybe** | Streak 1 exists; no academic reason after assignment marked submitted |

**Net:** The product currently buys a *streak*, not a *habit of studying*.

---

## 12. Top 10 highest-impact product improvements

*(Ranked. Do not implement in this audit.)*

1. **Make AI Tutor actually answer**, and never render system/context prompts to the user.
2. **One home for “what do I do now?”** — merge Study Buddy + Emergency Plan + today’s deadlines into a single Today screen.
3. **Cut the nav to ~6 items** (Today, Tutor, Deadlines, Money, Progress, Settings). Hide the rest until needed.
4. **Fix first-run:** never “Welcome back”; never open another account’s dashboard from Create account; one onboarding path with a single goal.
5. **Safe Spend = (pocket − necessary − spent) / days left**, with a necessary-expenses field.
6. **Assignments: human urgency** (“Due in 3 days”), status Done/Doing, default due date not silently today, and one button to get help on *that* assignment.
7. **Study sessions need a real timer** or no streak/XP.
8. **Exam Prep’s first screen is the plan**, not a sitemap.
9. **Mobile: four tabs**, not a replica of the desktop sidebar.
10. **Ship three languages properly** (EN/HI/GU) or don’t claim them; delete the Coming-soon world tour.

---

## 13. Launch readiness scores (0–10)

| Dimension | Score | Why |
| --- | --- | --- |
| First impression | **6** | Headline is clear; nav and fake-looking preview undermine it. |
| Ease of use | **4** | Signup is OK; the logged-in app is a directory. |
| Study usefulness | **5** | Emergency Plan and basic deadlines work; Exam Prep and Study Buddy are thin without more data. |
| AI usefulness | **2** | Live tutor failed the specified question and leaked internals. |
| Money usefulness | **5** | Logging works; Safe Spend is simplistic; too many money pages. |
| Mobile experience | **4** | Hamburger exists; IA and header are still desktop. |
| Visual professionalism | **6** | Dark UI is consistent; landing is slick; in-app density and leftover English/caps hurt. |
| Trust | **3** | Session surprise, prompt leak, demo numbers, gimmick stats. |
| Retention potential | **4** | Streaks exist; academic reason-to-return is weak. |
| **Overall product experience** | **4** | A serious student workspace idea trapped in a bloated, half-wired AI shell. |

**Launch stance:** Not ready as a daily student product. Ready as a **private beta** only if AI Tutor and Today/IA are treated as blockers.

---

## Appendix — Flows actually performed

- Opened live landing; read hero and nav.
- Hit Create account while a prior session existed → `/dashboard` as demo user “there”.
- Signed out from Settings.
- Registered a new account; set name Aarav; completed onboarding (Sample University, B.Tech CSE, Sem 3, Programming + Mathematics + C Programming, ₹5,000 INR).
- Used dashboard, Study Buddy (plan + session complete), Assignments (create due 2026-09-21, find, mark done → SUBMITTED).
- Opened Exam Prep hub; generated Emergency Plan (used DBMS assignment).
- Asked AI Tutor the pointers question + Give an Example follow-up.
- Money Dashboard; logged Food ₹120 Lunch; opened Budget and set Food limit ₹2,000.
- Games & Streaks; Class Hub empty join; Leaderboard opt-in empty.
- Settings: Hindi UI, then Gujarati UI.
- Mobile viewport 375×812 dashboard + nav drawer.

**Not fully completed as separate clean accounts:** 10 isolated signups.  
**Not fully completed:** Question Generator paper, Quiz Rush playthrough, Money Coach chat, Can I Afford It purchase, guest Try AI Tutor from landing, logged-out mobile landing at 375px after language change.

---

AI USER FEEDBACK AUDIT COMPLETE  
REPORT: AI_USER_FEEDBACK_REPORT.md
