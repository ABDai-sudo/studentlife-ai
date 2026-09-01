"use client";

function escapeHtml(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

/** Lightweight markdown-ish renderer (no raw HTML execution). */
export function SafeMarkdown({ content }: { content: string }) {
  const blocks = content.split(/\n\n+/);
  return (
    <div className="space-y-3 text-sm leading-relaxed text-foreground">
      {blocks.map((block, i) => {
        const trimmed = block.trim();
        if (!trimmed) return null;
        if (trimmed.startsWith("```")) {
          const code = trimmed.replace(/^```[a-z]*\n?/i, "").replace(/```$/, "");
          return (
            <pre
              key={i}
              className="overflow-x-auto rounded-lg bg-surface-secondary p-3 text-xs"
            >
              <code>{code}</code>
            </pre>
          );
        }
        if (trimmed.startsWith("# ")) {
          return (
            <h3 key={i} className="text-base font-semibold">
              {trimmed.slice(2)}
            </h3>
          );
        }
        if (trimmed.startsWith("## ")) {
          return (
            <h4 key={i} className="text-sm font-semibold">
              {trimmed.slice(3)}
            </h4>
          );
        }
        if (trimmed.startsWith("### ")) {
          return (
            <h5 key={i} className="text-sm font-semibold">
              {trimmed.slice(4)}
            </h5>
          );
        }
        if (
          trimmed
            .split("\n")
            .every((l) => /^[-*]\s/.test(l) || l.trim() === "")
        ) {
          return (
            <ul key={i} className="list-disc space-y-1 pl-5">
              {trimmed.split("\n").map((line, j) =>
                line.trim() ? (
                  <li key={j}>{line.replace(/^[-*]\s/, "")}</li>
                ) : null
              )}
            </ul>
          );
        }
        if (
          trimmed
            .split("\n")
            .every((l) => /^\d+\.\s/.test(l) || l.trim() === "")
        ) {
          return (
            <ol key={i} className="list-decimal space-y-1 pl-5">
              {trimmed.split("\n").map((line, j) =>
                line.trim() ? (
                  <li key={j}>{line.replace(/^\d+\.\s/, "")}</li>
                ) : null
              )}
            </ol>
          );
        }
        const html = escapeHtml(trimmed)
          .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
          .replace(
            /`([^`]+)`/g,
            "<code class='rounded bg-surface-secondary px-1'>$1</code>"
          )
          .replace(/\n/g, "<br/>");
        return <p key={i} dangerouslySetInnerHTML={{ __html: html }} />;
      })}
    </div>
  );
}
