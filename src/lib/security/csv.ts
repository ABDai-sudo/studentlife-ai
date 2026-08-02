/** Prevent CSV formula injection */
export function escapeCsvCell(value: unknown): string {
  let s = value == null ? "" : String(value);
  if (/^[=+\-@]/.test(s) || s.startsWith("\t") || s.startsWith("\r")) {
    s = `'${s}`;
  }
  if (/[",\n\r]/.test(s)) {
    s = `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function toCsv(
  headers: string[],
  rows: Array<Array<unknown>>,
  maxRows = 5000
): string {
  const limited = rows.slice(0, maxRows);
  const lines = [
    headers.map(escapeCsvCell).join(","),
    ...limited.map((row) => row.map(escapeCsvCell).join(",")),
  ];
  return lines.join("\n");
}
