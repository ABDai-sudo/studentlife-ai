import type { ReactNode } from "react";

type ProductWindowProps = {
  children: ReactNode;
  title?: string;
  className?: string;
};

export function ProductWindow({
  children,
  title = "app.studentlife.ai",
  className = "",
}: ProductWindowProps) {
  return (
    <div className={`app-window ${className}`}>
      <div className="app-window-chrome">
        <span className="app-window-dot" />
        <span className="app-window-dot" />
        <span className="app-window-dot" />
        <span className="ml-3 truncate text-xs font-medium text-muted">
          {title}
        </span>
      </div>
      <div>{children}</div>
    </div>
  );
}
