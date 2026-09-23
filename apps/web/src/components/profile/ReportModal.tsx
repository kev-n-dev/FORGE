import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { api, ApiClientError } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, AlertCircle } from "lucide-react";

type ReportReason =
  | "fraud" | "fake_credentials" | "harassment" | "suspicious_behavior"
  | "fake_review" | "spam" | "inappropriate_content" | "other";

const REASONS: { value: ReportReason; label: string }[] = [
  { value: "fraud", label: "Fraud or scam" },
  { value: "fake_credentials", label: "Fake credentials" },
  { value: "harassment", label: "Harassment or threats" },
  { value: "fake_review", label: "Fake review" },
  { value: "spam", label: "Spam" },
  { value: "inappropriate_content", label: "Inappropriate content" },
  { value: "suspicious_behavior", label: "Suspicious behavior" },
  { value: "other", label: "Other" },
];

interface ReportModalProps {
  open: boolean;
  onClose: () => void;
  targetType: "professional" | "review" | "customer";
  targetId: string;
  targetName?: string;
}

export function ReportModal({ open, onClose, targetType, targetId, targetName }: ReportModalProps) {
  const { isAuthenticated } = useAuth();
  const [reason, setReason] = useState<ReportReason | "">("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!reason || description.length < 10) return;
    setSubmitting(true);
    setError("");
    try {
      await api.post("/reports", {
        targetType,
        targetId,
        reason,
        description,
        turnstileToken: "XXXX.DUMMY.TOKEN.XXXX",
      });
      setSubmitted(true);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Failed to submit report.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setReason("");
    setDescription("");
    setSubmitted(false);
    setError("");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={`Report ${targetType === "review" ? "review" : targetName ?? "user"}`}
      description="Reports are reviewed by our moderation team. False reports may result in account action."
    >
      {!isAuthenticated ? (
        <div className="space-y-4">
          <p className="text-sm text-charcoal-400">You need to be signed in to submit a report.</p>
          <Link to="/login" className="guild-btn-primary inline-flex" onClick={handleClose}>
            Sign in
          </Link>
        </div>
      ) : submitted ? (
        <div className="text-center space-y-3 py-4">
          <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto" />
          <p className="font-medium text-charcoal-100">Report submitted</p>
          <p className="text-sm text-charcoal-400">Our team will review it and take appropriate action.</p>
          <Button onClick={handleClose} variant="secondary">Close</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-900/30 border border-red-800 rounded-lg p-3 text-sm text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
          <div>
            <label className="guild-label">Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as ReportReason)}
              className="guild-input mt-1.5"
            >
              <option value="">Select a reason…</option>
              {REASONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="guild-label">
              Description
              <span className="text-charcoal-500 font-normal ml-1">(min 10 characters)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Describe what happened…"
              className="guild-input resize-none mt-1.5"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={handleClose}>Cancel</Button>
            <Button
              variant="danger"
              onClick={() => void handleSubmit()}
              loading={submitting}
              disabled={!reason || description.length < 10}
            >
              Submit report
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
