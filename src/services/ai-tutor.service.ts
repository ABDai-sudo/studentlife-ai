import { listSubjects, listAssignments, listExams } from "@/services/academics.service";

export type AiTutorReply = {
  reply: string;
  provider: "rules" | "openai" | "gemini";
  disclaimer: string;
};

const DISCLAIMER =
  "Study help only — always check with your course materials and teachers.";

async function buildStudyContext(userId: string) {
  const [subjects, assignments, exams] = await Promise.all([
    listSubjects(userId),
    listAssignments(userId),
    listExams(userId),
  ]);

  const pending = assignments
    .filter((a) => a.status === "PENDING" || a.status === "IN_PROGRESS")
    .slice(0, 5)
    .map((a) => `${a.title}${a.subject ? ` (${a.subject})` : ""} due ${a.dueDate.toISOString().slice(0, 10)}`)
    .join("; ");

  const upcoming = exams
    .filter((e) => e.examDate >= new Date(new Date().toISOString().slice(0, 10)))
    .slice(0, 5)
    .map((e) => `${e.title} — ${e.subject} on ${e.examDate.toISOString().slice(0, 10)}`)
    .join("; ");

  return {
    text: [
      `Subjects: ${subjects.map((s) => s.name).join(", ") || "none yet"}`,
      `Pending assignments: ${pending || "none"}`,
      `Upcoming exams: ${upcoming || "none"}`,
    ].join("\n"),
  };
}

function rulesTutor(message: string, context: string, subject?: string): string {
  const q = message.toLowerCase();
  if (q.includes("study plan") || q.includes("revise") || q.includes("exam")) {
    return `Here's a simple 5-day study plan${subject ? ` for ${subject}` : ""}:\n1) Day 1 — skim syllabus + list weak topics\n2) Day 2 — notes for topic 1–2\n3) Day 3 — practice questions\n4) Day 4 — past papers / worksheets\n5) Day 5 — quick revision + rest\n\nYour context:\n${context}`;
  }
  if (q.includes("explain") || q.includes("what is") || q.includes("how")) {
    return `I'll keep it simple${subject ? ` (${subject})` : ""}:\n1) Say the idea in one sentence\n2) Break it into 3 small steps\n3) Give one everyday example\n4) Write 2 practice questions for yourself\n\nYour question: “${message}”\nTip: compare this with your class notes. ${context.includes("none yet") ? "Add your subjects and exams so I can personalize more." : ""}`;
  }
  if (q.includes("homework") || q.includes("assignment")) {
    return `Assignment tip: split the work into outline → draft → check → submit. Your pending items:\n${context}`;
  }
  return `Ask me to explain a topic, make a study plan, or help prioritize homework.\n\n${context}`;
}

async function callOpenAI(system: string, userMessage: string) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.4,
      max_tokens: 500,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userMessage },
      ],
    }),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return json.choices?.[0]?.message?.content?.trim() || null;
}

async function callGemini(system: string, userMessage: string) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || "gemini-2.0-flash"}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: `${system}\n\nStudent question: ${userMessage}` }],
          },
        ],
        generationConfig: { temperature: 0.4, maxOutputTokens: 500 },
      }),
    }
  );
  if (!res.ok) return null;
  const json = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  return json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
}

export async function askStudyTutor(
  userId: string,
  message: string,
  subject?: string
): Promise<AiTutorReply> {
  const { text } = await buildStudyContext(userId);
  const system = `You are StudentLife study tutor. Explain clearly for students. Be concise. Never invent grades or claim you submitted homework. Use the student context when useful.\n\nContext:\n${text}${subject ? `\nFocus subject: ${subject}` : ""}`;

  const providerPref = (process.env.AI_PROVIDER || "openai").toLowerCase();
  let reply: string | null = null;
  let used: AiTutorReply["provider"] = "rules";

  if (providerPref === "gemini") {
    reply = await callGemini(system, message);
    if (reply) used = "gemini";
  } else {
    reply = await callOpenAI(system, message);
    if (reply) used = "openai";
  }

  if (!reply) {
    reply = rulesTutor(message, text, subject);
    used = "rules";
  }

  return { reply, provider: used, disclaimer: DISCLAIMER };
}
