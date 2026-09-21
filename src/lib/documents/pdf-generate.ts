const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 54;
const TITLE_SIZE = 18;
const H1_SIZE = 14;
const BODY_SIZE = 11;

function pdfEscape(text: string): string {
  return winAnsi(text)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function winAnsi(text: string): string {
  return [...text]
    .map((ch) => {
      const code = ch.charCodeAt(0);
      if (ch === "\n" || ch === "\r" || ch === "\t") return ch;
      if (code >= 32 && code <= 126) return ch;
      const map: Record<number, string> = {
        0x2018: "'",
        0x2019: "'",
        0x201c: '"',
        0x201d: '"',
        0x2013: "-",
        0x2014: "-",
        0x2026: "...",
        0x00a0: " ",
        0x20b9: "Rs.",
      };
      if (map[code]) return map[code];
      if (code >= 160 && code <= 255) return ch;
      return ch.normalize("NFKD").replace(/[\u0300-\u036f]/g, "") || "?";
    })
    .join("");
}

function wrap(text: string, fontSize: number): string[] {
  const max = Math.floor(((PAGE_W - MARGIN * 2) / (fontSize * 0.5)) * 1.05);
  const lines: string[] = [];
  for (const para of text.replace(/\r/g, "").split("\n")) {
    if (!para.trim()) {
      lines.push("");
      continue;
    }
    const words = para.split(/\s+/);
    let current = "";
    for (const word of words) {
      const next = current ? `${current} ${word}` : word;
      if (next.length > max && current) {
        lines.push(current);
        current = word;
      } else {
        current = next;
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

export type PdfSection = {
  heading?: string;
  body: string;
};

export type PdfInput = {
  title: string;
  subtitle?: string;
  sections: PdfSection[];
  answers?: PdfSection[];
};

function pageStream(
  lines: { text: string; size: number; bold?: boolean }[],
  pageNo: number,
  pageCount: number
): string {
  const ops: string[] = ["BT"];
  let y = PAGE_H - MARGIN;
  for (const line of lines) {
    if (y < MARGIN + 28) break;
    const font = line.bold ? "/F2" : "/F1";
    ops.push(`${font} ${line.size} Tf`);
    ops.push(`1 0 0 1 ${MARGIN.toFixed(2)} ${y.toFixed(2)} Tm`);
    ops.push(`(${pdfEscape(line.text)}) Tj`);
    y -= line.size + 4;
  }
  ops.push("ET");
  ops.push("BT");
  ops.push(`/F1 9 Tf`);
  ops.push(`1 0 0 1 ${(PAGE_W / 2 - 20).toFixed(2)} 28 Tm`);
  ops.push(`(${pdfEscape(`${pageNo} / ${pageCount}`)}) Tj`);
  ops.push("ET");
  return ops.join("\n");
}

function paginate(input: PdfInput): string[][] {
  const pages: { text: string; size: number; bold?: boolean }[][] = [];
  let current: { text: string; size: number; bold?: boolean }[] = [];
  let used = 0;
  const budget = PAGE_H - MARGIN * 2 - 20;

  const pushLine = (line: { text: string; size: number; bold?: boolean }) => {
    const h = line.size + 4;
    if (used + h > budget && current.length) {
      pages.push(current);
      current = [];
      used = 0;
    }
    current.push(line);
    used += h;
  };

  pushLine({ text: input.title.slice(0, 120), size: TITLE_SIZE, bold: true });
  if (input.subtitle) {
    pushLine({ text: input.subtitle.slice(0, 160), size: 10 });
  }
  pushLine({ text: "", size: 8 });

  const addSections = (sections: PdfSection[]) => {
    for (const section of sections) {
      if (section.heading) {
        pushLine({ text: section.heading.slice(0, 140), size: H1_SIZE, bold: true });
      }
      for (const row of wrap(section.body, BODY_SIZE)) {
        pushLine({ text: row, size: BODY_SIZE });
      }
      pushLine({ text: "", size: 8 });
    }
  };

  addSections(input.sections);
  if (input.answers?.length) {
    pages.push(current);
    current = [];
    used = 0;
    pushLine({ text: "Answer key", size: TITLE_SIZE, bold: true });
    pushLine({ text: "", size: 8 });
    addSections(input.answers);
  }
  if (current.length) pages.push(current);
  return pages.map((p) => p.map((l) => `${l.bold ? "B" : "N"}|${l.size}|${l.text}`));
}

export function buildSimplePdf(input: PdfInput): Buffer {
  const packed = paginate(input);
  const pageCount = packed.length || 1;
  const streams = packed.map((rows, index) => {
    const lines = rows.map((row) => {
      const [flag, size, ...rest] = row.split("|");
      return {
        bold: flag === "B",
        size: Number(size),
        text: rest.join("|"),
      };
    });
    return pageStream(lines, index + 1, pageCount);
  });

  const kidsCount = streams.length;
  // Object numbers: 1 catalog, 2 pages, 3 F1, 4 F2, then pairs of page+content
  const font1 = 3;
  const font2 = 4;
  let nextId = 5;
  const pageObjNums: number[] = [];
  const contentObjNums: number[] = [];
  for (let i = 0; i < kidsCount; i++) {
    pageObjNums.push(nextId++);
    contentObjNums.push(nextId++);
  }

  const pagesObj = `<< /Type /Pages /Kids [${pageObjNums
    .map((n) => `${n} 0 R`)
    .join(" ")}] /Count ${kidsCount} >>`;

  const body: { num: number; raw: string }[] = [
    { num: 1, raw: "<< /Type /Catalog /Pages 2 0 R >>" },
    { num: 2, raw: pagesObj },
    { num: font1, raw: "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>" },
    {
      num: font2,
      raw: "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    },
  ];

  streams.forEach((stream, i) => {
    const pageNum = pageObjNums[i];
    const contentNum = contentObjNums[i];
    body.push({
      num: pageNum,
      raw: `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 ${font1} 0 R /F2 ${font2} 0 R >> >> /Contents ${contentNum} 0 R >>`,
    });
    const bytes = Buffer.from(stream, "latin1");
    body.push({
      num: contentNum,
      raw: `<< /Length ${bytes.length} >>\nstream\n${stream}\nendstream`,
    });
  });

  body.sort((a, b) => a.num - b.num);
  const max = body[body.length - 1]?.num ?? 1;
  const byNum = new Map(body.map((b) => [b.num, b.raw]));

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (let i = 1; i <= max; i++) {
    offsets[i] = Buffer.byteLength(pdf, "latin1");
    const raw = byNum.get(i) ?? "<< >>";
    pdf += `${i} 0 obj\n${raw}\nendobj\n`;
  }
  const xref = Buffer.byteLength(pdf, "latin1");
  pdf += `xref\n0 ${max + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i <= max; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer << /Size ${max + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf, "latin1");
}

export function markdownToPdfInput(title: string, markdown: string): PdfInput {
  const sections: PdfSection[] = [];
  let heading: string | undefined;
  let body: string[] = [];
  const flush = () => {
    if (heading || body.length) {
      sections.push({ heading, body: body.join("\n").trim() || " " });
    }
    heading = undefined;
    body = [];
  };
  for (const line of markdown.replace(/\r/g, "").split("\n")) {
    const h = line.match(/^#{1,3}\s+(.+)/);
    if (h) {
      flush();
      heading = h[1].trim();
      continue;
    }
    body.push(line.replace(/^[-*]\s+/, "• ").replace(/^\d+\.\s+/, (m) => m));
  }
  flush();
  if (!sections.length) {
    sections.push({ body: markdown || " " });
  }
  return { title, sections };
}

export function looksLikePdfIntent(message: string): boolean {
  return /\b(pdf|question paper|revision sheet|make notes|make assignment|downloadable|printable)\b/i.test(
    message
  );
}

export function wantsAnswerKey(message: string): boolean {
  return /\b(answer key|answers|solutions?)\b/i.test(message);
}

export function safeDownloadName(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${base || "studentlife-notes"}.pdf`;
}
