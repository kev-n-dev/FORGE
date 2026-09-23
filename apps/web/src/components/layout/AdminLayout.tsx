import { Outlet, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@guild/types";
import { Users, Flag, FileText, ShieldAlert, Settings, BarChart2, ToggleLeft } from "lucide-react";

export function AdminLayout() {
  const { user } = useAuth();

  if (!user || (user.role !== UserRole.Admin && user.role !== UserRole.SuperAdmin)) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <ShieldAlert className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-charcoal-400">You do not have permission to access this area.</p>
      </div>
    );
  }

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: BarChart2 },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/reports", label: "Reports", icon: Flag },
    { href: "/admin/reviews", label: "Reviews", icon: FileText },
    { href: "/admin/verifications", label: "Verifications", icon: ShieldAlert },
    { href: "/admin/audit-logs", label: "Audit Logs", icon: FileText },
    { href: "/admin/feature-flags", label: "Feature Flags", icon: ToggleLeft },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-r border-charcoal-800 bg-charcoal-900 hidden lg:flex flex-col">
        <div className="p-4 border-b border-charcoal-800">
          <p className="text-xs font-semibold uppercase tracking-widest text-charcoal-500">
            Admin Panel
          </p>
        </div>
        <nav className="p-3 space-y-1 flex-1" aria-label="Admin navigation">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              to={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-charcoal-400 hover:bg-charcoal-800 hover:text-charcoal-50 transition-colors"
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
