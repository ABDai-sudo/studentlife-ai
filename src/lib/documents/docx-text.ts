import { inflateRawSync } from "zlib";

function readUInt32LE(buf: Buffer, offset: number) {
  return buf.readUInt32LE(offset);
}

function readUInt16LE(buf: Buffer, offset: number) {
  return buf.readUInt16LE(offset);
}

/**
 * Minimal ZIP reader for DOCX `word/document.xml`.
 */
export function extractDocxText(buffer: Buffer): string {
  if (buffer.length < 30 || buffer.toString("ascii", 0, 2) !== "PK") {
    return "";
  }

  let offset = 0;
  while (offset + 30 <= buffer.length) {
    const sig = readUInt32LE(buffer, offset);
    if (sig !== 0x04034b50) break;
    const flags = readUInt16LE(buffer, offset + 6);
    const method = readUInt16LE(buffer, offset + 8);
    const nameLen = readUInt16LE(buffer, offset + 26);
    const extraLen = readUInt16LE(buffer, offset + 28);
    const compSize = readUInt32LE(buffer, offset + 18);
    const nameStart = offset + 30;
    const name = buffer.toString("utf8", nameStart, nameStart + nameLen);
    const dataStart = nameStart + nameLen + extraLen;
    if (flags & 0x08) {
      // Data descriptor: sizes after the data — skip this entry.
      offset = dataStart;
      const next = buffer.indexOf("PK", offset);
      if (next < 0) break;
      offset = next;
      continue;
    }
    const data = buffer.subarray(dataStart, dataStart + compSize);
    if (name === "word/document.xml") {
      let xml: Buffer;
      if (method === 0) xml = Buffer.from(data);
      else if (method === 8) xml = inflateRawSync(data);
      else return "";
      return xmlToPlain(xml.toString("utf8"));
    }
    offset = dataStart + compSize;
  }
  return "";
}

function xmlToPlain(xml: string): string {
  return xml
    .replace(/<w:tab\/>/g, "\t")
    .replace(/<w:br\/>/g, "\n")
    .replace(/<\/w:p>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
