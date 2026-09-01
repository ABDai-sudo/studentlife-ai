import { buildStudentAiContext } from "@/services/ai/context";
import { completeChat } from "@/services/ai/provider";
import {
  appendMessage,
  createConversation,
  getConversation,
} from "@/services/ai-conversation.service";

export type AiTutorReply = {
  reply: string;
  provider: "rules" | "openai" | "gemini";
  disclaimer: string;
  conversationId: string;
};

const DISCLAIMER =
  "Study help only — always check with your course materials and teachers.";

const MODE_INSTRUCTIONS: Record<string, string> = {
  default: "Answer clearly with headings and bullet points when helpful.",
  explain_simply: "Explain in simple words for a beginner. Short sentences.",
  explain_detail: "Explain in depth with steps, edge cases, and exam tips.",
  exam_ready: "Give a concise exam-ready answer with key points to memorize.",
  example: "Focus on one clear worked example.",
  diagram: "Describe a simple diagram or flowchart in text/ASCII if useful.",
  notes: "Produce clean study notes with headings and bullets.",
  test_me: "Ask 5 practice questions, then provide an answer key at the end.",
  flashcards: "Produce 8 flashcards as Q: / A: pairs.",
  translate: "Translate or rephrase the prior academic content clearly.",
  continue: "Continue from the previous answer without repeating it.",
};

function languageFromContext(context: string): string {
  const match = context.match(/Preferred explanation language:\s*(.+)/i);
  return match?.[1]?.trim() || "English";
}

function rulesTutor(
  message: string,
  context: string,
  subject?: string,
  mode = "default"
): string {
  const focus = subject ? ` for **${subject}**` : "";
  const modeHint = MODE_INSTRUCTIONS[mode] || MODE_INSTRUCTIONS.default;
  const lang = languageFromContext(context);
  const lower = lang.toLowerCase();

  if (lower.startsWith("hindi") || lower.includes("हिन्दी") || lower.includes("हिंदी")) {
    return [
      `## स्टडी हेल्प${focus}`,
      "",
      "नीचे एक साधारण स्टडी फ्रेम है। टेक्निकल शब्द (जैसे binary search) अंग्रेज़ी में रह सकते हैं।",
      "",
      `### आपका सवाल`,
      message,
      "",
      `### आसान तरीका`,
      "1. आइडिया को एक वाक्य में कहें",
      "2. 3–5 साफ़ स्टेप्स में तोड़ें",
      "3. एक रोज़मर्रा का उदाहरण जोड़ें",
      "4. दो सेल्फ-चेक सवाल लिखें",
      "",
      `### आपका सेव्ड कॉन्टेक्स्ट`,
      "```",
      context,
      "```",
      "",
      "_अगर सिलेबस या चैप्टर नोट्स ऊपर नहीं हैं, तो टॉपिक्स पेस्ट करें या नोट्स अपलोड करें।_",
    ].join("\n");
  }

  if (lower.startsWith("gujarati") || lower.includes("ગુજરાતી")) {
    return [
      `## સ્ટડી હેલ્પ${focus}`,
      "",
      "નીચે એક સરળ સ્ટડી ફ્રેમ છે. ટેક્નિકલ શબ્દો (જેમ કે binary search) અંગ્રેજીમાં રહી શકે.",
      "",
      `### તમારો પ્રશ્ન`,
      message,
      "",
      `### સરળ રીત`,
      "1. આઇડિયાને એક વાક્યમાં કહો",
      "2. 3–5 સ્પષ્ટ સ્ટેપ્સમાં તોડો",
      "3. રોજિંદા જીવનનું એક ઉદાહરણ ઉમેરો",
      "4. બે સેલ્ફ-ચેક પ્રશ્નો લખો",
      "",
      `### તમારો સેવ્ડ કૉન્ટેક્સ્ટ`,
      "```",
      context,
      "```",
      "",
      "_જો સિલેબસ અથવા ચેપ્ટર નોટ્સ ઉપર ન હોય, તો ટોપિક્સ પેસ્ટ કરો અથવા નોટ્સ અપલોડ કરો._",
    ].join("\n");
  }

  return [
    `## Study help${focus}`,
    "",
    modeHint,
    "",
    `### Your question`,
    message,
    "",
    `### Suggested approach`,
    "1. Restate the idea in one sentence",
    "2. Break it into 3–5 clear steps",
    "3. Add one everyday example",
    "4. Write 2 self-check questions",
    "",
    `### Your saved context`,
    "```",
    context,
    "```",
    "",
    "_If your syllabus or chapter notes are not listed above, paste topics or upload notes so answers can match your course._",
  ].join("\n");
}

export async function askStudyTutor(
  userId: string,
  message: string,
  options?: {
    subject?: string;
    conversationId?: string;
    mode?: string;
  }
): Promise<AiTutorReply> {
  const mode = options?.mode || "default";
  let conversationId = options?.conversationId;

  if (!conversationId) {
    const created = await createConversation(
      userId,
      message.slice(0, 60),
      options?.subject
    );
    conversationId = created.id;
  }

  const context = await buildStudentAiContext(userId);
  let historyBlock = "";
  const existing = await getConversation(userId, conversationId);
  if (existing?.messages?.length) {
    historyBlock = existing.messages
      .slice(-8)
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");
  }

  await appendMessage(userId, conversationId, "USER", message);

  const system = [
    "You are StudentLife AI Tutor — a clear, accurate academic tutor for school and college students.",
    MODE_INSTRUCTIONS[mode] || MODE_INSTRUCTIONS.default,
    "Use markdown. Never invent grades, submissions, or fake citations.",
    "Never pretend to know college-specific information that is not in the student context.",
    "Match the student's preferred explanation language (see context LANGUAGE RULE). Tone may follow personality, but the written language must follow the preferred explanation language.",
    "Keep technical terms like HTML, CSS, SQL, CGPA, and XP in English when that is clearer.",
    "",
    "Student context:",
    context,
    historyBlock ? `\nRecent conversation:\n${historyBlock}` : "",
  ].join("\n");

  const { text, provider } = await completeChat({
    system,
    user: message,
    maxTokens: 1200,
  });

  const reply =
    text || rulesTutor(message, context, options?.subject, mode);

  await appendMessage(
    userId,
    conversationId,
    "ASSISTANT",
    reply,
    provider
  );

  return {
    reply,
    provider,
    disclaimer: DISCLAIMER,
    conversationId,
  };
}
