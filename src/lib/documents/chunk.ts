export function chunkDocument(text: string, size = 1400, overlap = 180): string[] {
  const clean = text.replace(/\s+\n/g, "\n").trim();
  if (!clean) return [];
  const chunks: string[] = [];
  let i = 0;
  while (i < clean.length) {
    const end = Math.min(clean.length, i + size);
    chunks.push(clean.slice(i, end));
    if (end >= clean.length) break;
    i = Math.max(i + 1, end - overlap);
  }
  return chunks.slice(0, 80);
}

export function retrieveChunks(text: string, query: string, limit = 4): string[] {
  const chunks = chunkDocument(text);
  if (!chunks.length) return [];
  const terms = query
    .toLowerCase()
    .split(/\W+/)
    .filter((t) => t.length > 2)
    .slice(0, 12);
  if (!terms.length) return chunks.slice(0, limit);
  const ranked = chunks
    .map((chunk, index) => {
      const lower = chunk.toLowerCase();
      let score = 0;
      for (const term of terms) {
        if (lower.includes(term)) score += 2;
      }
      return { chunk, score, index };
    })
    .sort((a, b) => b.score - a.score || a.index - b.index);
  const picked = ranked.filter((r) => r.score > 0).slice(0, limit);
  return (picked.length ? picked : ranked.slice(0, limit)).map((r) => r.chunk);
}
