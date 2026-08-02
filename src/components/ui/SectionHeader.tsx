type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
  className = "",
}: SectionHeaderProps) {
  const alignClass = align === "center" ? "mx-auto text-center" : "";

  return (
    <div className={`max-w-2xl ${alignClass} ${className}`}>
      {eyebrow ? (
        <p className="mb-2 text-sm font-semibold text-primary">{eyebrow}</p>
      ) : null}
      <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[1.85rem]">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 text-[0.975rem] leading-relaxed text-secondary">
          {description}
        </p>
      ) : null}
    </div>
  );
}
