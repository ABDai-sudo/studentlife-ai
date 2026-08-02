type AvatarProps = {
  name: string;
  size?: "sm" | "md";
  className?: string;
};

export function Avatar({ name, size = "sm", className = "" }: AvatarProps) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const sizeClass = size === "sm" ? "h-8 w-8 text-[0.7rem]" : "h-9 w-9 text-xs";

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-primary-soft font-semibold text-primary ${sizeClass} ${className}`}
      aria-hidden
    >
      {initials}
    </span>
  );
}
