export const adminNav = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/live", label: "Live Activity" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/analytics", label: "Product Analytics" },
  { href: "/admin/features", label: "Feature Usage" },
  { href: "/admin/health", label: "System Health" },
  { href: "/admin/errors", label: "Errors" },
  { href: "/admin/security", label: "Security Center" },
  { href: "/admin/audit", label: "Audit Logs" },
  { href: "/admin/database", label: "Database Status" },
  { href: "/admin/settings", label: "Settings" },
] as const;
