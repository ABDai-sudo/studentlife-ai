# StudentLife AI — AI Feedback Findings Verification

**Live product:** https://studentlife-ai.vercel.app  
**Verification date:** 18 September 2026  
**Method:** Independent UI reproduction on the live site. No code edits, commits, push, deploy, or redesign.  
**Primary test account (brand-new):** `sl.verify.918b@gmail.com` · display name **Meera**  
**Leftover session found at start of this run:** `panel.studentlife.918@gmail.com` · display name **Aarav** (Gujarati UI) — previous audit account, not used as first-time evidence after it was identified.

Screenshots were captured in the Cursor browser session (`verify-*.png` in the local screenshot temp folder).

---

## 1. SIGNUP / AUTH

### CLAIM
“Create account can skip signup and open an already signed-in dashboard.”

### TEST METHOD
1. Opened the live landing page in this browser.
2. Clicked **Create account** / **Create a free account**.
3. Signed out of the leftover session, then registered a new email.
4. After Meera was signed in, visited landing (still showed Log in / Create account) and opened `/signup` again.

### CLEAN SESSION: NO, then YES
- First pass was **not** clean: cookies already held Aarav’s session.
- After **Sign out**, a second pass was a signed-out session (signup form appeared).

### ACTUAL RESULT
- **Contaminated first click:** Landing still showed Log in / Create account, then navigation landed on `/dashboard` as **Aarav** in Gujarati (`panel.studentlife.918@gmail.com`). That is leftover-session contamination, not a brand-new user magically becoming Aarav.
- **After Sign out:** `/signup` showed the registration form (email, password rules, EN/हि/ગુ). New account **Meera** / `sl.verify.918b@gmail.com` was created, onboarding ran, dashboard showed Meera (not Aarav).
- **Logout works.** Sign out returned to the public landing.
- **Signed-in Create account (real product behavior):** While Meera was signed in, landing still advertised **Create account** → `https://studentlife-ai.vercel.app/signup`. Opening `/signup` **redirected to `/dashboard` for Meera** with no signup form and no “switch account” prompt.

### EVIDENCE
- Contaminated dashboard: Aarav, Gujarati, `panel.studentlife.918@gmail.com` — `verify-1-create-account-skipped-to-aarav-dashboard.png`
- Signup form after sign-out: heading “Create account” — `verify-1-signup-form-after-signout.png`
- Signed-in `/signup` → Meera dashboard — `verify-1-signup-redirects-when-signed-in.png`

### CLASSIFICATION
- **TEST CONTAMINATION** for “clean unauthenticated first visit opens an unrelated existing account.” After sign-out, new signup worked and isolation was Meera-only.
- **CONFIRMED HIGH** for “Create account while a session exists skips registration and opens the current dashboard.” Landing copy still says Create account / Log in, so a shared-browser student can think they are registering and instead enter someone else’s workspace. That matches the *mechanism* of the original report; the *specific* Aarav/demo identity in the previous report was leftover session data.

---

## 2. AI TUTOR

### CLAIM
“AI Tutor did not explain C pointers and exposed internal prompt/saved context.”

### TEST METHOD
On Meera’s new account, `/dashboard/ai-tutor`.  
Sent exactly: `Explain pointers in C programming like I am a beginner.`  
Then: `Give me a simple example.`

### CLEAN SESSION: YES
(Meera account, empty tutor history.)

### ACTUAL RESULT
- Both replies were a “Study help” shell: suggested 4-step approach, then a fenced **Your saved context** block.
- The block included institution/course/semester, study goal, subjects, empty notes/assignments/exams, then **`LANGUAGE RULE (mandatory)`**, personality vs language instructions, “Do not fabricate citations,” etc.
- **No beginner explanation of pointers.** Follow-up was treated as a new empty “Your question Give me a simple example.” with the same leak — no C example, no continuity of teaching.

### EVIDENCE
- Full on-screen leak (first answer and follow-up) via page text and screenshots: `verify-2-ai-tutor-prompt-leak.png`, `verify-2-ai-tutor-followup-leak.png`
- Quoted leak (abridged): `Your saved context ``` Institution: Sample University ... LANGUAGE RULE (mandatory): Respond in English unless the student explicitly asks... Do not fabricate citations or references. ````

### CLASSIFICATION
**CONFIRMED BLOCKER**

Internal instructions and saved student context are visible. Headline tutor does not teach.

---

## 3. SAFE SPEND

### CLAIM
Pocket money ₹5000 + necessary expenses ₹2000 should answer “How much can I safely spend today?” Previous run showed **₹384.61**.

### TEST METHOD
Onboarding pocket money defaulted to **5000** (INR). No field for necessary expenses. Dashboard + Money Dashboard inspected immediately after first-time setup. Profile money settings and Budget/Expenses pages checked for a necessary-expenses input.

### CLEAN SESSION: YES
(Meera, ₹0 logged spend.)

### ACTUAL RESULT
- **₹384.61 is arithmetically correct for the product’s stated formula.** UI copy: **Money left ÷ days left**. Money left ₹5,000 · Days left **13** · 5000 ÷ 13 = **384.615… → ₹384.61**.
- Onboarding, Profile “Money settings,” and Budget page have **no “necessary expenses ₹2000” field**. Budget is **category monthly limits**. Expenses is a transaction log (Amount / category / note), not a reserved necessities total.
- A student cannot enter “necessary ₹2000” as a first-class input. If they logged ₹2000 as an expense, remaining would fall and Safe Spend would change; that is spend tracking, not a reserved-necessities plan.
- Money Dashboard **Health score 61 / Fair** with ₹0 spent is confusing.
- Sidebar Budget is labeled “Pocket money” but the page is category limits.

**Verdict on ₹384.61:** not a calculation bug. It is the intended remaining÷days number, **missing reserved necessities**, and **easy to misread** as “safe after rent/food/travel.”

### EVIDENCE
- First-time dashboard: ₹5,000 / ₹384.61 / 13 days / “Money left ÷ days left” — `verify-7-first-time-dashboard-meera.png`
- Money Dashboard: Remaining ₹5,000, Safe daily spend ₹384.61, Health 61 Fair — `verify-3-money-dashboard-384.png`
- Onboarding: Monthly pocket money = 5000; no necessary-expenses field.
- Profile: Pocket money ₹5,000 only.

### CLASSIFICATION
**CONFIRMED HIGH** (product/UX: cannot encode necessary ₹2000; formula does not reserve it)  
Not a math bug. Not a false positive on the number.

---

## 4. EXAM PREP

### CLAIM
Exam Prep is merely a link hub; panic students need a usable exam workflow. Emergency Plan / Study Buddy may be the real tools.

### TEST METHOD
Opened Exam Prep, Exams calendar, Emergency Plan, Study Buddy as Meera. Added exam **C Programming midterm · 2026-09-20**, then generated a catch-up plan.

### CLEAN SESSION: YES
(New account; exam added during this verification.)

### ACTUAL RESULT
- **Exam Prep (`/dashboard/exam-prep`)** is a **directory of six outbound cards**: Question papers, AI Tutor, Emergency plan, Exams calendar, Focus Sprint, Notes. No in-page plan, paper, or timer. Confirmed link hub.
- **Exams calendar** is a usable add-exam form. Adding the midterm worked (`C Programming · MIDTERM · 2026-09-20`).
- **Study Buddy** with no exam (first look): “C Programming / No urgent deadline. Review this subject you already added.” After the exam existed: recommended **C Programming midterm** with “Exam on 2026-09-20.”
- **Emergency Plan** generated a real now/next/later schedule after the exam existed: Do now = Revise C Programming 50 min; Do next = Exam prep 45 min; Later = light revision; sleep protected; sessions added to timetable.

Exam workflow **exists**, split across calendar + Emergency Plan + Study Buddy. **Exam Prep itself is not that workflow.**

### EVIDENCE
- Hub: `verify-4-exam-prep-hub.png`
- Study Buddy empty-deadline: `verify-4-study-buddy-no-deadline.png`
- Emergency plan after exam: `verify-4-emergency-plan-after-exam.png`

### CLASSIFICATION
**CONFIRMED HIGH** (Exam Prep is a link hub; panic path requires guessing other nav items)

---

## 5. HINDI / GUJARATI

### CLAIM
HI/GU mixed language; some wrong verbs; legal/privacy often English.

### TEST METHOD
Walked dashboard, Study Buddy, Settings in **English**, **Hindi**, and **Gujarati** (Gujarati also observed on leftover Aarav session before sign-out). Captured mixed strings from the live UI.

### CLEAN SESSION: YES for EN/HI on Meera; Gujarati also confirmed on Aarav leftover UI and prior settings page

### ACTUAL RESULT

#### English
Usable. Corporate tone. “Welcome back” on a first-time dashboard.

#### Hindi (Meera)
**Translation bugs / leftover English UI**
- Privacy: `We protect your personal data and only use it to provide StudentLife AI services.`
- Privacy: `We do not sell personal data. Budgeting guidance only — not banking or credit advice.`
- About footer: `Study, assignment, exam, streak, and budget tools for students...`
- Personality line: `Clear and formal`
- Status helper: `In class` / `Grinding` left in English inside Hindi sentence
- Quests stay English: `Add or complete one assignment task + 30 XP`, `Study C Programming for 25 minutes + 35 XP`, `Complete a 5-question practice set + 25 XP`
- `Getting started` untranslated
- `Academic Aura`
- Study Buddy generated line: `Exam on 2026-09-20.`
- Timetable items: `Revise: C Programming 16:00`, `Exam prep: C Programming 18:00`
- Weak topics: `Profile में जोड़ें`
- Avatar themes: Aurora, Ember, Mint, …

**Intentionally untranslated / product names (reasonable)**
- AI Tutor, Study Buddy, Assignment Helper, Exam Prep, Question Generator, Emergency Plan, Money Coach, Class Hub, XP, CGPA, StudentLife

**Wrong-verb / awkward translation**
- Study Buddy: `अभी क्या पढ़ें` / `अभी क्या पढ़ूँ?` (“what to **read** now”) instead of study
- Sidebar mix: `AI Tutor कुछ भी पूछो`

**Content generated in wrong language**
- Exam date line and timetable block titles in English while UI is Hindi
- Quests generated/stored in English

#### Gujarati (Aarav leftover + settings)
**Translation bugs**
- Same English privacy/legal/about strings
- `Clear and formal`
- `Getting started`
- Quests in English: `Study C Programming for 25 minutes`
- `In class` / `Grinding` inside Gujarati helper
- `Study Buddy ખોલો` on dashboard CTA

**Intentionally untranslated technical/product terms**
- AI Tutor, Study Buddy, Assignment Helper, Exam Prep, Money Coach, Academic Aura, XP, Aurora/Ember theme names

**Wrong-verb**
- `હવે શું વાંચવું` (“what to **read** now”)

### EVIDENCE
- Gujarati settings privacy English: `verify-5-gujarati-settings-privacy-english.png`
- Hindi Study Buddy / sidebar mix: `verify-5-hindi-settings-mixed.png` (file also covers Hindi Study Buddy chrome)
- Hindi mobile dashboard mixed quests: `verify-6-mobile-dashboard-375.png`

### CLASSIFICATION
**CONFIRMED HIGH** (incomplete localization; legal copy stuck in English; “read” vs “study”; generated quests/exam lines in English)

---

## 6. MOBILE 375PX

### CLAIM
“Hamburger opens but full desktop navigation is dumped onto mobile.”

### TEST METHOD
`Emulation.setDeviceMetricsOverride` 375×812. Landing, dashboard, hamburger, Study Buddy CTA, assignments/money links in chrome.

### CLEAN SESSION: YES (Meera, mobile viewport)

### ACTUAL RESULT
- Landing at 375px: condensed header (logo, Create account, hamburger). Usable.
- Dashboard: **sidebar collapses** to **नेविगेशन खोलें**. Header is dense (menu, theme, bell, settings, Meera chip overlapping/truncating).
- Opening the drawer exposes the **same full STUDY / MONEY / ACCOUNT list** (Dashboard through Settings: 24 destinations), not a reduced mobile set. Content remains in the accessibility tree underneath.
- Study Buddy / Assignments / Money remain reachable; they are not a separate mobile IA.

**Severity:** High for daily phone use (scroll tax, no simplified Today nav). Not a total blocker: hamburger does open and destinations work.

### EVIDENCE
- 375 dashboard chrome: `verify-6-mobile-dashboard-375.png`, `verify-6-mobile-landing-375.png`
- Open menu a11y tree includes all desktop items (AI Tutor, Study Buddy, … Reports, Profile, Settings)

### CLASSIFICATION
**CONFIRMED HIGH**

---

## 7. FIRST-TIME DASHBOARD

### CLAIM
New dashboard has 20+ sidebar items, XP/Aura/quests before meaningful setup, unclear next action.

### TEST METHOD
Judged **immediately after Meera’s onboarding**, before money logging. (Later actions added XP/exam; first-run screenshot is the source of truth.)

### CLEAN SESSION: YES

### ACTUAL RESULT
Sidebar (24 app destinations, excluding header chrome):  
Dashboard, AI Tutor, Study Buddy, Games & Streaks, Leaderboard, Subjects, Notes, Assignments, Assignment Helper, Exam Prep, Question Generator, Timetable, Emergency Plan, Progress, Class Hub, Money Dashboard, Expenses, Budget, Money Coach, Savings Goals, Can I Afford It?, Reports, Profile, Settings.

First-run content:
- Greeting **Welcome back** (first visit)
- **Do now:** `Add or complete one assignment task` (quest), not a chosen academic goal
- Streak 0, Level 1, **0 XP**, **Academic Aura 50/100**, quests **0 of 3**
- Quests already named (assignment, 25 min C Programming, 5-question set)
- Money widgets already showing ₹5,000 and ₹384.61; “Budget looks comfortable” with zero spend
- Share card available immediately

Next action is **unclear**: many equally loud modules; primary “Do now” is gamification.

### EVIDENCE
`verify-7-first-time-dashboard-meera.png`

### CLASSIFICATION
**CONFIRMED HIGH**

---

## Summary tables

### CONFIRMED BLOCKERS
- **AI Tutor** returns system prompt + saved context instead of teaching C pointers; follow-up also leaks. Trust/safety + core feature failure.

### CONFIRMED HIGH ISSUES
- **Create account while signed in** skips registration and opens the current dashboard; landing still looks logged-out.
- **Safe Spend ₹384.61** matches remaining÷days (5000/13) but **cannot take necessary ₹2000**; Budget ≠ pocket money; Health 61 at ₹0 spend.
- **Exam Prep is a link hub**; usable panic workflow is Emergency Plan + calendar + Study Buddy, elsewhere.
- **HI/GU mixed language**, English legal/privacy, “read” vs “study,” English quests/generated exam lines.
- **Mobile 375px:** hamburger dumps the full desktop nav; dense header.
- **First-time dashboard:** 24 sidebar items, Welcome back, XP/Aura/quests before work, unclear next step.

### FALSE POSITIVES
- **₹384.61 as a calculation error** — false if claimed as wrong arithmetic. The number is correct for the documented formula.

### TEST-CONTAMINATED FINDINGS
- **“Create account from a clean session opened Aarav / demoabdaistudio / ‘there’”** — reproduced here only because **Aarav’s session was already in the browser**. After Sign out, signup created **Meera** and did not show Aarav.
- Previous report’s first-visit skip should be read as **session leftover + signed-in redirect**, not “anonymous visitors always inherit a random account.”

---

## Extra notes (not in original seven claims, observed)
- Login/logout isolation **works** once signed out: new account is distinct.
- AI explanation language vs UI language **is** split (Study Buddy: “व्याख्या: English (UI भाषा से अलग)”).
- Language picker lists many locales as **Coming soon**.

---

AI FEEDBACK VERIFICATION COMPLETE
