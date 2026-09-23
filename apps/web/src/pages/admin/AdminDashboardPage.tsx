import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { Flag, Users, FileText, Shield, BarChart2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/cn";

interface ReportRow {
  id: string;
  reporter_id: string;
  target_type: string;
  target_id: string;
  reason: string;
  description: string;
  status: string;
  created_at: string;
}

interface UserRow {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  reported: "text-amber-400 bg-amber-900/20 border-amber-800",
  under_investigation: "text-blue-400 bg-blue-900/20 border-blue-800",
  resolved: "text-green-400 bg-green-900/20 border-green-800",
  dismissed: "text-charcoal-400 bg-charcoal-800 border-charcoal-700",
  confirmed_violation: "text-red-400 bg-red-900/20 border-red-800",
};

export function AdminDashboardPage() {
  const queryClient = useQueryClient();

  const { data: reports, isLoading: reportsLoading } = useQuery({
    queryKey: ["admin", "reports"],
    queryFn: () => api.get<ReportRow[]>("/admin/reports"),
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => api.get<{ items: UserRow[]; pagination: { total: number } }>("/admin/users"),
  });

  const updateReportMutation = useMutation({
    mutationFn: ({ id, status, adminNotes }: { id: string; status: string; adminNotes?: string }) =>
      api.post(`/admin/reports/${id}/status`, { status, adminNotes }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["admin", "reports"] }),
  });

  const stats = [
    {
      label: "Open Reports",
      value: reportsLoading ? "…" : String(reports?.filter((r) => r.status === "reported").length ?? 0),
      icon: Flag,
      color: "text-red-400",
    },
    {
      label: "Total Users",
      value: usersLoading ? "…" : String(usersData?.pagination?.total ?? 0),
      icon: Users,
      color: "text-blue-400",
    },
    {
      label: "Under Investigation",
      value: reportsLoading ? "…" : String(reports?.filter((r) => r.status === "under_investigation").length ?? 0),
      icon: Shield,
      color: "text-amber-400",
    },
    {
      label: "Resolved",
      value: reportsLoading ? "…" : String(reports?.filter((r) => ["resolved", "dismissed"].includes(r.status)).length ?? 0),
      icon: CheckCircle2,
      color: "text-green-400",
    },
  ];

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-charcoal-50 flex items-center gap-2">
          <BarChart2 className="h-6 w-6 text-copper-500" aria-hidden="true" />
          Admin Dashboard
        </h1>
        <p className="text-charcoal-400 text-sm mt-1">Platform overview and moderation queue.</p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="guild-card p-5 space-y-3">
            <Icon className={`h-6 w-6 ${color}`} aria-hidden="true" />
            <div>
              <p className="text-2xl font-bold text-charcoal-50">{value}</p>
              <p className="text-sm text-charcoal-400">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Open reports */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-charcoal-100 flex items-center gap-2">
          <Flag className="h-5 w-5 text-red-400" aria-hidden="true" />
          Reports Queue
        </h2>

        {reportsLoading ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : !reports || reports.length === 0 ? (
          <div className="guild-card p-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-green-400 mx-auto mb-3" aria-hidden="true" />
            <p className="text-charcoal-400">No open reports. Queue is clear.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((r) => (
              <div key={r.id} className="guild-card p-5">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={cn(
                          "text-xs font-medium px-2 py-0.5 rounded border",
                          STATUS_COLORS[r.status] ?? "text-charcoal-400 bg-charcoal-800 border-charcoal-700"
                        )}
                      >
                        {r.status.replace(/_/g, " ")}
                      </span>
                      <span className="text-xs text-charcoal-500">
                        {r.target_type} · {r.reason.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="text-sm text-charcoal-200 leading-relaxed line-clamp-2">
                      {r.description}
                    </p>
                    <p className="text-xs text-charcoal-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" aria-hidden="true" />
                      {new Date(r.created_at).toLocaleDateString("en-US", {
                        year: "numeric", month: "short", day: "numeric",
                      })}
                    </p>
                  </div>

                  {/* Actions */}
                  {r.status === "reported" && (
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => updateReportMutation.mutate({
                          id: r.id,
                          status: "under_investigation",
                          adminNotes: "Under review",
                        })}
                        loading={updateReportMutation.isPending}
                      >
                        Investigate
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => updateReportMutation.mutate({
                          id: r.id,
                          status: "dismissed",
                          adminNotes: "Dismissed — no violation found",
                        })}
                        loading={updateReportMutation.isPending}
                      >
                        Dismiss
                      </Button>
                    </div>
                  )}
                  {r.status === "under_investigation" && (
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => updateReportMutation.mutate({
                          id: r.id,
                          status: "confirmed_violation",
                          adminNotes: "Violation confirmed",
                        })}
                        loading={updateReportMutation.isPending}
                      >
                        <XCircle className="h-4 w-4" aria-hidden="true" />
                        Confirm
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => updateReportMutation.mutate({
                          id: r.id,
                          status: "resolved",
                          adminNotes: "Resolved",
                        })}
                        loading={updateReportMutation.isPending}
                      >
                        Resolve
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent users */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-charcoal-100 flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-400" aria-hidden="true" />
          Recent Users
        </h2>
        {usersLoading ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : (
          <div className="guild-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-charcoal-800">
                  <th className="text-left px-4 py-3 text-charcoal-400 font-medium">Email</th>
                  <th className="text-left px-4 py-3 text-charcoal-400 font-medium">Role</th>
                  <th className="text-left px-4 py-3 text-charcoal-400 font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-charcoal-400 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {usersData?.items?.map((u) => (
                  <tr key={u.id} className="border-b border-charcoal-800 last:border-0 hover:bg-charcoal-800/50 transition-colors">
                    <td className="px-4 py-3 text-charcoal-200">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className="capitalize text-charcoal-300">{u.role}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded border",
                        u.status === "active"
                          ? "text-green-400 bg-green-900/20 border-green-800"
                          : "text-red-400 bg-red-900/20 border-red-800"
                      )}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-charcoal-400">
                      {new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Audit reminders */}
      <div className="guild-card p-5">
        <h2 className="text-base font-semibold text-charcoal-100 mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4 text-charcoal-400" aria-hidden="true" />
          Audit reminders
        </h2>
        <ul className="text-sm text-charcoal-400 space-y-2">
          {[
            "Every review removal must have an audit record.",
            "User suspensions and bans must have documented reasons.",
            "Verification decisions are logged and cannot be retroactively altered.",
            "Advertising cannot affect reputation scores, ratings, or verification status.",
          ].map((reminder) => (
            <li key={reminder} className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-charcoal-600 shrink-0 mt-0.5" aria-hidden="true" />
              {reminder}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
