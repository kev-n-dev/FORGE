import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Spinner } from "@/components/ui/Spinner";
import { Flag, Users, FileText, Shield, BarChart2 } from "lucide-react";

export function AdminDashboardPage() {
  // Lightweight summary queries — counts only
  const { data: openReports, isLoading } = useQuery({
    queryKey: ["admin", "reports", "open"],
    queryFn: () => api.get<Array<{ id: string }>>("/admin/reports?page=1"),
  });

  const stats = [
    {
      label: "Open Reports",
      value: isLoading ? "…" : String(Array.isArray(openReports) ? openReports.length : 0),
      icon: Flag,
      color: "text-red-400",
    },
    { label: "Pending Verifications", value: "—", icon: Shield, color: "text-amber-400" },
    { label: "Active Users", value: "—", icon: Users, color: "text-blue-400" },
    { label: "Reviews Today", value: "—", icon: FileText, color: "text-green-400" },
  ];

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-charcoal-50 flex items-center gap-2">
          <BarChart2 className="h-6 w-6 text-copper-500" aria-hidden="true" />
          Admin Dashboard
        </h1>
        <p className="text-charcoal-400 text-sm mt-1">
          Platform overview and moderation queue.
        </p>
      </div>

      {isLoading ? (
        <Spinner />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="forge-card p-5 space-y-3">
              <Icon className={`h-6 w-6 ${color}`} aria-hidden="true" />
              <div>
                <p className="text-2xl font-bold text-charcoal-50">{value}</p>
                <p className="text-sm text-charcoal-400">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="forge-card p-5">
        <h2 className="text-base font-semibold text-charcoal-100 mb-3">Audit reminders</h2>
        <ul className="text-sm text-charcoal-400 space-y-2 list-disc list-inside">
          <li>Every review removal must have an audit record.</li>
          <li>User suspensions and bans must have documented reasons.</li>
          <li>Verification decisions are logged and cannot be retroactively altered.</li>
          <li>Advertising cannot affect reputation scores, ratings, or verification status.</li>
        </ul>
      </div>
    </div>
  );
}
