import Link from "next/link";

type LogoProps = {
  href?: string;
  className?: string;
  compact?: boolean;
  light?: boolean;
};

export function Logo({
  href = "/",
  className = "",
  compact = false,
  light = false,
}: LogoProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2.5 ${className}`}
      aria-label="StudentLife AI home"
    >
      <span
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-[0.7rem] font-bold tracking-tight text-white"
        aria-hidden
      >
        SL
      </span>
      {!compact ? (
        <span
          className={`text-[0.95rem] font-semibold tracking-tight ${
            light ? "text-white" : "text-foreground"
          }`}
        >
          StudentLife{" "}
          <span className={light ? "text-white/80" : "text-primary"}>AI</span>
        </span>
      ) : null}
    </Link>
  );
}
