export type TutorLang = "en" | "hi" | "gu";

export function tutorLangFromLabel(lang: string): TutorLang {
  const lower = lang.toLowerCase();
  if (lower.startsWith("hindi") || lower.includes("हिन्दी") || lower.includes("हिंदी")) {
    return "hi";
  }
  if (lower.startsWith("gujarati") || lower.includes("ગુજરાતી")) {
    return "gu";
  }
  return "en";
}

function lastUserTopic(history: string): string {
  const matches = [...history.matchAll(/(?:^|\n)user:\s*(.+)/gi)];
  const last = matches.at(-1)?.[1]?.trim() ?? "";
  return last;
}

function extractTopic(message: string, history: string): string {
  const explain = message.match(
    /(?:explain|describe|what (?:is|are)|समझाओ|समझाइए|સમજાવો)\s+(.+?)(?:\s+like\s+i|\s+in\s+simple|$)/i
  );
  if (explain?.[1]) {
    return explain[1]
      .replace(/\bin\s+c\s+programming\b/gi, "in C")
      .replace(/\blike i am a beginner\.?/gi, "")
      .trim();
  }
  if (/example|उदाहरण|ઉદાહરણ|code sample/i.test(message)) {
    const prior = lastUserTopic(history);
    const fromPrior = extractTopic(prior, "");
    if (fromPrior) return fromPrior;
  }
  const trimmed = message.replace(/^(apply mode:\s*)/i, "").trim();
  return trimmed.slice(0, 80) || "this topic";
}

function wantsExample(message: string, mode?: string): boolean {
  if (mode === "example") return true;
  return /\b(example|sample|code|demo|उदाहरण|નમૂનો|ઉદાહરણ)\b/i.test(message);
}

type Concept = {
  test: RegExp;
  explain: Record<TutorLang, string>;
  example: Record<TutorLang, string>;
};

const CONCEPTS: Concept[] = [
  {
    test: /\bpointers?\b|पॉइंटर|પોઇન્ટર/i,
    explain: {
      en: [
        "## Pointers in C (beginner)",
        "",
        "A **pointer** is a variable that stores the **memory address** of another variable, not the value itself.",
        "",
        "Think of a house number: the number is not the house, but it tells you where the house is. A pointer works the same way for values in memory.",
        "",
        "### Core ideas",
        "- `int x = 10;` puts the value `10` in some memory slot.",
        "- `int *p = &x;` makes `p` hold the address of `x`. `&` means “address of”.",
        "- `*p` means “go to that address and read/write the value”. This is called **dereferencing**.",
        "",
        "### Why they matter",
        "Pointers let C functions change values in the caller, walk arrays, and build structures like linked lists. You will see `*` and `&` in almost every C course.",
        "",
        "Ask for a simple example if you want a short program next.",
      ].join("\n"),
      hi: [
        "## C में पॉइंटर (शुरुआत)",
        "",
        "**पॉइंटर** एक वैरिएबल है जो किसी दूसरे वैरिएबल का **मेमोरी एड्रेस** रखता है, खुद वैल्यू नहीं।",
        "",
        "घर का नंबर घर नहीं होता, लेकिन बताता है घर कहाँ है। पॉइंटर मेमोरी के साथ वैसा ही काम करता है।",
        "",
        "### मुख्य बातें",
        "- `int x = 10;` वैल्यू `10` को मेमोरी में रखता है।",
        "- `int *p = &x;` में `p` के पास `x` का एड्रेस होता है। `&` का मतलब “एड्रेस ऑफ़”।",
        "- `*p` का मतलब उस एड्रेस पर जाकर वैल्यू पढ़ना/लिखना। इसे **डिरेफ़रेंस** कहते हैं।",
        "",
        "अगर चाहिए तो एक छोटा C उदाहरण माँगें।",
      ].join("\n"),
      gu: [
        "## Cમાં પોઇન્ટર (શરૂઆત)",
        "",
        "**પોઇન્ટર** એ વેરિયેબલ છે જે બીજા વેરિયેબલનું **મેમરી એડ્રેસ** રાખે છે, પોતે વેલ્યૂ નહીં.",
        "",
        "ઘરનો નંબર ઘર નથી, પણ કહે છે ઘર ક્યાં છે. પોઇન્ટર મેમરી સાથે એવું જ કરે છે.",
        "",
        "### મુખ્ય વાતો",
        "- `int x = 10;` વેલ્યૂ `10` મેમરીમાં મૂકે છે.",
        "- `int *p = &x;`માં `p` પાસે `x`નું એડ્રેસ છે. `&` એટલે “address of”.",
        "- `*p` એટલે તે એડ્રેસ પર જઈને વેલ્યૂ વાંચવી/લખવી. આને **dereference** કહે છે.",
        "",
        "જોઈએ તો એક નાનું C ઉદાહરણ માગો.",
      ].join("\n"),
    },
    example: {
      en: [
        "## Simple C pointer example",
        "",
        "```c",
        "#include <stdio.h>",
        "",
        "int main(void) {",
        "    int x = 10;",
        "    int *p = &x;   /* p stores the address of x */",
        "",
        "    printf(\"x = %d\\n\", x);",
        "    printf(\"value via pointer = %d\\n\", *p);",
        "",
        "    *p = 20;       /* change x through the pointer */",
        "    printf(\"x is now %d\\n\", x);",
        "    return 0;",
        "}",
        "```",
        "",
        "- `p` holds where `x` lives.",
        "- `*p` reads or writes that location.",
        "- After `*p = 20`, `x` becomes `20` because both names refer to the same memory.",
      ].join("\n"),
      hi: [
        "## सरल C पॉइंटर उदाहरण",
        "",
        "```c",
        "#include <stdio.h>",
        "",
        "int main(void) {",
        "    int x = 10;",
        "    int *p = &x;",
        "",
        "    printf(\"x = %d\\n\", x);",
        "    printf(\"pointer se value = %d\\n\", *p);",
        "",
        "    *p = 20;",
        "    printf(\"ab x = %d\\n\", x);",
        "    return 0;",
        "}",
        "```",
        "",
        "- `p` में `x` का एड्रेस है।",
        "- `*p` उसी जगह की वैल्यू पढ़ता/लिखता है।",
        "- `*p = 20` के बाद `x` भी 20 हो जाता है।",
      ].join("\n"),
      gu: [
        "## સરળ C પોઇન્ટર ઉદાહરણ",
        "",
        "```c",
        "#include <stdio.h>",
        "",
        "int main(void) {",
        "    int x = 10;",
        "    int *p = &x;",
        "",
        "    printf(\"x = %d\\n\", x);",
        "    printf(\"pointer thi value = %d\\n\", *p);",
        "",
        "    *p = 20;",
        "    printf(\"have x = %d\\n\", x);",
        "    return 0;",
        "}",
        "```",
        "",
        "- `p` પાસે `x`નું એડ્રેસ છે.",
        "- `*p` તે જ જગ્યાની વેલ્યૂ વાંચે/લખે છે.",
        "- `*p = 20` પછી `x` પણ 20 થાય છે.",
      ].join("\n"),
    },
  },
];

function genericExplain(topic: string, lang: TutorLang): string {
  if (lang === "hi") {
    return [
      `## ${topic} — आसान समझ`,
      "",
      `**${topic}** को एक मुख्य विचार समझें, फिर छोटे स्टेप्स में तोड़ें।`,
      "",
      "1. यह क्या है — एक वाक्य में परिभाषा",
      "2. यह क्यों ज़रूरी है — परीक्षा या कोड में कहाँ आता है",
      "3. एक रोज़मर्रा की तुलना",
      "4. दो सेल्फ-चेक सवाल",
      "",
      "टेक्निकल शब्द अंग्रेज़ी में रह सकते हैं। एक छोटा उदाहरण माँग सकते हैं।",
    ].join("\n");
  }
  if (lang === "gu") {
    return [
      `## ${topic} — સરળ સમજ`,
      "",
      `**${topic}**ને એક મુખ્ય વિચાર તરીકે સમજો, પછી નાના સ્ટેપમાં તોડો.`,
      "",
      "1. આ શું છે — એક વાક્યમાં",
      "2. શા માટે જરૂરી છે",
      "3. રોજિંદી સરખામણી",
      "4. બે સેલ્ફ-ચેક પ્રશ્નો",
      "",
      "ટેક્નિકલ શબ્દો અંગ્રેજીમાં રહી શકે. નાનું ઉદાહરણ માગી શકો.",
    ].join("\n");
  }
  return [
    `## ${topic} — beginner view`,
    "",
    `Start with one sentence: what **${topic}** is, then why it shows up in your course.`,
    "",
    "1. Name the idea in plain words",
    "2. Say where you will use it (exam, lab, or code)",
    "3. Compare it to something everyday",
    "4. Write two self-check questions",
    "",
    "Ask for a simple example if you want a short worked case next.",
  ].join("\n");
}

function genericExample(topic: string, lang: TutorLang): string {
  if (lang === "hi") {
    return [
      `## ${topic} — छोटा उदाहरण`,
      "",
      "एक छोटा, सही उदाहरण:",
      "",
      "1. समस्या को एक लाइन में लिखें",
      "2. इनपुट और आउटपुट तय करें",
      "3. 4–6 स्टेप्स में हल करें",
      "",
      `यह उदाहरण **${topic}** पर केंद्रित है। कोर्स नोट्स से मिलान ज़रूर करें।`,
    ].join("\n");
  }
  if (lang === "gu") {
    return [
      `## ${topic} — નાનું ઉદાહરણ`,
      "",
      "1. પ્રશ્ન એક લાઇનમાં લખો",
      "2. ઇનપુટ અને આઉટપુટ નક્કી કરો",
      "3. 4–6 સ્ટેપમાં ઉકેલો",
      "",
      `આ **${topic}** પર કેન્દ્રિત છે. કોર્સ નોટ્સ સાથે ચકાસો.`,
    ].join("\n");
  }
  return [
    `## Simple example: ${topic}`,
    "",
    "1. State the problem in one line",
    "2. List the input and the expected result",
    "3. Walk through 4–6 clear steps",
    "",
    `Keep the example focused on **${topic}**. Match it to your course notes when you have them.`,
  ].join("\n");
}

/**
 * Local teaching fallback used when no LLM text is available.
 * Never includes system prompts or saved student context.
 */
export function buildTutorFallback(input: {
  message: string;
  explanationLang: string;
  history?: string;
  mode?: string;
  subject?: string;
}): string {
  const lang = tutorLangFromLabel(input.explanationLang);
  const history = input.history ?? "";
  const topic = extractTopic(input.message, history);
  const example = wantsExample(input.message, input.mode);
  const concept = CONCEPTS.find((c) => c.test.test(`${topic} ${history} ${input.message}`));

  if (concept) {
    return example ? concept.example[lang] : concept.explain[lang];
  }

  const focus = input.subject ? ` (${input.subject})` : "";
  const body = example ? genericExample(topic, lang) : genericExplain(topic + focus, lang);
  return body;
}
