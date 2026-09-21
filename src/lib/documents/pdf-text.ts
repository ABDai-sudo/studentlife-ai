import { inflateRawSync, inflateSync } from "zlib";

function decodePdfLiteral(raw: string): string {
  return raw
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\\/g, "\\")
    .replace(/\\(\d{1,3})/g, (_, oct) =>
      String.fromCharCode(parseInt(oct, 8) & 255)
    );
}

function stringsFromPdfContent(content: string): string {
  const chunks: string[] = [];
  const tj = /(?:\((?:\\.|[^\\)])*\)|<[\da-fA-F]+>)\s*Tj/g;
  for (const match of content.matchAll(tj)) {
    const token = match[0];
    const paren = token.match(/^\(([\s\S]*)\)\s*Tj$/);
    if (paren) {
      chunks.push(decodePdfLiteral(paren[1]));
      continue;
    }
    const hex = token.match(/^<([\da-fA-F]+)>\s*Tj$/);
    if (hex) {
      const bytes = hex[1].replace(/\s/g, "");
      const out: number[] = [];
      for (let i = 0; i < bytes.length; i += 2) {
        out.push(parseInt(bytes.slice(i, i + 2), 16));
      }
      chunks.push(Buffer.from(out).toString("latin1"));
    }
  }

  const arrays = /\[([\s\S]*?)\]\s*TJ/g;
  for (const match of content.matchAll(arrays)) {
    const inner = match[1];
    for (const piece of inner.matchAll(/\((?:\\.|[^\\)])*\)/g)) {
      chunks.push(decodePdfLiteral(piece[0].slice(1, -1)));
    }
  }

  return chunks.join(" ").replace(/[ \t]+\n/g, "\n").replace(/[ ]{2,}/g, " ").trim();
}

function inflatePdfStream(bytes: Buffer): string | null {
  try {
    return inflateSync(bytes).toString("latin1");
  } catch {
    try {
      return inflateRawSync(bytes).toString("latin1");
    } catch {
      return null;
    }
  }
}

/**
 * Best-effort text extraction for common PDFs (FlateDecode + Tj/TJ).
 * Returns empty string when the file has no extractable text layer.
 */
export function extractPdfText(buffer: Buffer): { text: string; pageCount: number } {
  const raw = buffer.toString("latin1");
  const pageCount = Math.max(1, (raw.match(/\/Type\s*\/Page(?![s])/g) || []).length);

  const pages: string[] = [];
  const streamRe = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match: RegExpExecArray | null;
  while ((match = streamRe.exec(raw))) {
    const headerStart = raw.lastIndexOf("<<", match.index);
    const header = headerStart >= 0 ? raw.slice(headerStart, match.index) : "";
    const payload = Buffer.from(match[1], "latin1");
    let content = payload.toString("latin1");
    if (/\/Filter\s*\/FlateDecode/.test(header) || /\/Filter\s*\[\s*\/FlateDecode/.test(header)) {
      const inflated = inflatePdfStream(payload);
      if (!inflated) continue;
      content = inflated;
    }
    const extracted = stringsFromPdfContent(content);
    if (extracted) pages.push(extracted);
  }

  if (!pages.length) {
    const fallback = stringsFromPdfContent(raw);
    return { text: fallback, pageCount };
  }

  const withPages = pages.map((p, i) => `[Page ${i + 1}]\n${p}`).join("\n\n");
  return { text: withPages.slice(0, 400_000), pageCount };
}
