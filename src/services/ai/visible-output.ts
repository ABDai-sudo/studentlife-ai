const LINE_LEAK =
  /^\s*(LANGUAGE RULE|Student context:|Preferred explanation language:|Personality controls tone only|Daily study minutes target:|Weak subjects \(student-reported\):|Board\/University:|Institution:|Upcoming exams:|Pending assignments:|Notes \(titles only\):|Rules:\s*Never invent)/i;

/**
 * Strip internal tutor instructions and private student context
 * so they can never reach the UI, even if a model echoes them.
 */
export function sanitizeTutorVisibleText(text: string): string {
  if (!text) return "";

  let out = text.replace(/```[\s\S]*?```/g, (block) =>
    /LANGUAGE RULE|Preferred explanation language|Student context:|Institution:/i.test(
      block
    )
      ? ""
      : block
  );

  out = out
    .split(/\r?\n/)
    .filter((line) => !LINE_LEAK.test(line))
    .join("\n");

  out = out
    .replace(/#{1,3}\s*(Your saved context|आपका सेव्ड कॉन्टेक्स्ट|તમારો સેવ્ડ કૉન્ટેક્સ્ટ)\b[\s\S]*?(?=\n#{1,3}\s|$)/gi, "")
    .replace(/LANGUAGE RULE\s*\(mandatory\)[\s\S]{0,800}/gi, "")
    .replace(/Do not fabricate citations or references\.?/gi, "")
    .replace(/Never invent college-specific[\s\S]{0,400}/gi, "");

  return out.replace(/\n{3,}/g, "\n\n").trim();
}

export function tutorOutputLooksLeaked(text: string): boolean {
  if (!text) return false;
  return /LANGUAGE RULE|Your saved context|Student context:|Personality controls tone only/i.test(
    text
  );
}
