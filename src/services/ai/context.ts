import { prisma } from "@/lib/db";
import { listSubjects, listAssignments, listExams } from "@/services/academics.service";

/** Hard rule appended to every student AI context block. */
export function explanationLanguageRule(lang: string): string {
  return [
    `LANGUAGE RULE (mandatory): Respond in ${lang} unless the student explicitly asks for another language in this message.`,
    "Personality controls tone only; language controls which language you write in. Do not switch to English just because the tone is casual or Gen-Z.",
    "Keep technical terms natural when clearer in English (HTML, CSS, JavaScript, SQL, API, HTTP, DBMS, CGPA, XP, C Programming, etc.) and explain them in the preferred language.",
    "Do not translate code identifiers, formulas, or proper nouns awkwardly.",
  ].join(" ");
}

export async function buildStudentAiContext(userId: string): Promise<string> {
  const [profile, subjects, assignments, exams, noteTitles] = await Promise.all([
    prisma.studentProfile.findUnique({ where: { userId } }),
    listSubjects(userId),
    listAssignments(userId),
    listExams(userId),
    prisma.note.findMany({
      where: { userId },
      select: { title: true },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
  ]);

  const pending = assignments
    .filter((a) => a.status === "PENDING" || a.status === "IN_PROGRESS")
    .slice(0, 6)
    .map(
      (a) =>
        `${a.title}${a.subject ? ` (${a.subject})` : ""} due ${a.dueDate.toISOString().slice(0, 10)}`
    )
    .join("; ");

  const upcoming = exams
    .filter((e) => e.examDate >= new Date(new Date().toISOString().slice(0, 10)))
    .slice(0, 6)
    .map(
      (e) =>
        `${e.title} — ${e.subject} on ${e.examDate.toISOString().slice(0, 10)}`
    )
    .join("; ");

  const explanationLang = profile?.preferredExplanationLang || "English";

  return [
    `Institution: ${profile?.institutionName || profile?.university || "not set"}`,
    `Board/University: ${profile?.boardOrUniversity || "not set"}`,
    `Course: ${profile?.course || "not set"}`,
    `Class/Semester: ${profile?.classOrSemester || (profile?.yearOfStudy != null ? `Year ${profile.yearOfStudy}` : "not set")}`,
    `Preferred explanation language: ${explanationLang}`,
    `Study goal: ${profile?.studyGoal || profile?.primaryGoal || "not set"}`,
    `Daily study minutes target: ${profile?.dailyStudyMinutes ?? "not set"}`,
    `Weak subjects (student-reported): ${profile?.weakSubjects || "not set"}`,
    `Subjects: ${subjects.map((s) => s.name).join(", ") || "none yet"}`,
    `Notes (titles only): ${noteTitles.map((n) => n.title).join("; ") || "none"}`,
    `Pending assignments: ${pending || "none"}`,
    `Upcoming exams: ${upcoming || "none"}`,
    explanationLanguageRule(explanationLang),
    "Rules: Never invent college-specific syllabus, marks schemes, or teacher instructions that are not in this context. If syllabus/material is missing, say so and ask the student to provide topics or upload notes. Keep academic content accurate and structured. Do not fabricate citations or references.",
  ].join("\n");
}
