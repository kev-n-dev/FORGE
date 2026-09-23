import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Bell, MessageSquare } from "lucide-react";
import { cn } from "@/lib/cn";
import { Link } from "@tanstack/react-router";
import type { Notification } from "@guild/types";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.get<Notification[]>("/notifications"),
    refetchInterval: 60_000,
    retry: false,
  });

  const { data: msgUnread } = useQuery({
    queryKey: ["messages", "unread-count"],
    queryFn: () => api.get<{ count: number }>("/messages/unread-count"),
    refetchInterval: 30_000,
    retry: false,
  });

  const unreadCount =
    (notifications?.filter((n) => !n.isRead).length ?? 0) +
    (msgUnread?.count ?? 0);

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.post(`/notifications/${id}/read`),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-lg text-charcoal-400 hover:text-charcoal-50 hover:bg-charcoal-800 transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {unreadCount > 0 && (
          <span
            className="absolute top-1 right-1 h-4 w-4 bg-copper-500 text-white text-xs rounded-full flex items-center justify-center font-bold"
            aria-hidden="true"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden="true" />

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-80 guild-card z-40 animate-fade-in overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-charcoal-800">
              <h3 className="font-semibold text-sm text-charcoal-100">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  className="text-xs text-copper-400 hover:text-copper-300 transition-colors"
                  onClick={() => {
                    notifications?.filter((n) => !n.isRead).forEach((n) => {
                      markReadMutation.mutate(n.id);
                    });
                  }}
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {/* Messages unread shortcut */}
              {(msgUnread?.count ?? 0) > 0 && (
                <Link
                  to="/messages"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 border-b border-charcoal-800 hover:bg-charcoal-800 transition-colors bg-charcoal-800/50"
                >
                  <div className="relative">
                    <MessageSquare className="h-5 w-5 text-copper-400" aria-hidden="true" />
                    <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-copper-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {msgUnread!.count > 9 ? "9+" : msgUnread!.count}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-charcoal-100">
                      {msgUnread!.count} unread message{msgUnread!.count !== 1 ? "s" : ""}
                    </p>
                    <p className="text-xs text-charcoal-400">Go to inbox</p>
                  </div>
                </Link>
              )}
              {!notifications || notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Bell className="h-8 w-8 text-charcoal-700 mx-auto mb-2" aria-hidden="true" />
                  <p className="text-sm text-charcoal-500">No notifications yet</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      "px-4 py-3 border-b border-charcoal-800 last:border-0 cursor-pointer hover:bg-charcoal-800 transition-colors",
                      !n.isRead && "bg-charcoal-800/50"
                    )}
                    onClick={() => {
                      if (!n.isRead) markReadMutation.mutate(n.id);
                      setOpen(false);
                    }}
                  >
                    <div className="flex items-start gap-2">
                      {!n.isRead && (
                        <span className="mt-1.5 h-2 w-2 rounded-full bg-copper-500 shrink-0" aria-hidden="true" />
                      )}
                      <div className={cn(!n.isRead ? "" : "ml-4")}>
                        <p className="text-sm font-medium text-charcoal-100">{n.title}</p>
                        <p className="text-xs text-charcoal-400 mt-0.5 leading-relaxed">{n.body}</p>
                        <p className="text-xs text-charcoal-600 mt-1">
                          {new Date(n.createdAt).toLocaleDateString("en-US", {
                            month: "short", day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
