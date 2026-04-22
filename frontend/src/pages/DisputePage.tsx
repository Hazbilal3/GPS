import React, { useEffect, useRef, useState, useMemo } from "react";
import AdminLayout from "../shareable/AdminLayout";
import { port } from "../port.interface";
import axios from "axios";

/* ── Types ───────────────────────────────────────────────────── */
interface DisputeMessage {
  id: number;
  senderRole: "admin" | "driver";
  senderName: string;
  content: string;
  attachmentUrl?: string;
  createdAt: string;
}

interface Dispute {
  id: number;
  driverId: number;
  driverName: string;
  title: string;
  status: "open" | "resolved";
  createdAt: string;
  updatedAt: string;
  messages: DisputeMessage[];
}

/* ── Helpers ─────────────────────────────────────────────────── */
function getRole(): "admin" | "driver" | "" {
  const raw = (
    localStorage.getItem("userRole") ??
    localStorage.getItem("role") ??
    ""
  )
    .toString()
    .toLowerCase()
    .trim();
  if (raw === "1" || raw === "admin") return "admin";
  if (raw === "2" || raw === "driver") return "driver";
  return "";
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ── Thread Modal ────────────────────────────────────────────── */
const ThreadModal: React.FC<{
  dispute: Dispute;
  role: "admin" | "driver";
  senderName: string;
  token: string;
  onClose: () => void;
  onUpdated: (d: Dispute) => void;
}> = ({ dispute, role, senderName, token, onClose, onUpdated }) => {
  const [messages, setMessages] = useState<DisputeMessage[]>(dispute.messages);
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [status, setStatus] = useState(dispute.status);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!text.trim() && !file) return;
    setSending(true);
    setErr(null);
    try {
      const formData = new FormData();
      formData.append("senderRole", role);
      formData.append("senderName", senderName);
      formData.append("content", text.trim());
      if (file) {
        formData.append("attachment", file);
      }

      const res = await axios.post(
        `${port}/disputes/${dispute.id}/messages`,
        formData,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } }
      );
      setMessages((prev) => [...prev, res.data]);
      setText("");
      setFile(null);
      onUpdated({ ...dispute, messages: [...messages, res.data], status });
    } catch {
      setErr("Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const toggleStatus = async () => {
    const newStatus = status === "open" ? "resolved" : "open";
    try {
      await axios.patch(
        `${port}/disputes/${dispute.id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStatus(newStatus);
      onUpdated({ ...dispute, messages, status: newStatus });
    } catch {
      setErr("Failed to update status.");
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: "var(--card-bg,#1e2535)",
          borderRadius: 14,
          width: "100%",
          maxWidth: 560,
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 12px 48px rgba(0,0,0,0.4)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 22px",
            borderBottom: "1px solid var(--border-color,#2a3347)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 12,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: 15,
                color: "var(--text-color,#e0e6f0)",
                marginBottom: 3,
                wordBreak: "break-word",
              }}
            >
              {dispute.title}
            </div>
            <div style={{ fontSize: 12, color: "#8896a5" }}>
              {dispute.driverName} &mdash; #{dispute.id}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
            {role === "admin" && (
              <button
                onClick={toggleStatus}
                style={{
                  padding: "4px 12px",
                  borderRadius: 20,
                  border: "none",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  background: status === "open" ? "rgba(46,213,115,0.15)" : "rgba(255,107,107,0.15)",
                  color: status === "open" ? "#2ed573" : "#ff6b6b",
                }}
              >
                {status === "open" ? "Mark Resolved" : "Re-open"}
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#8896a5",
                fontSize: 20,
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px 22px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {messages.map((m) => {
            const isMe =
              m.senderRole === role;
            return (
              <div
                key={m.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: isMe ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "78%",
                    background: isMe
                      ? "#4f9cf9"
                      : "var(--input-bg,#151c2c)",
                    color: isMe ? "#fff" : "var(--text-color,#e0e6f0)",
                    borderRadius: isMe
                      ? "14px 14px 4px 14px"
                      : "14px 14px 14px 4px",
                    padding: "10px 14px",
                    fontSize: 14,
                    lineHeight: 1.5,
                    wordBreak: "break-word",
                  }}
                >
                  {m.content}
                  {m.attachmentUrl && (
                    <div style={{ marginTop: 8 }}>
                      <a href={`${port}${m.attachmentUrl}`} target="_blank" rel="noreferrer" style={{ color: "inherit", textDecoration: "underline", fontSize: 12 }}>
                        📎 View Attachment
                      </a>
                    </div>
                  )}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#8896a5",
                    marginTop: 4,
                    paddingLeft: isMe ? 0 : 4,
                    paddingRight: isMe ? 4 : 0,
                  }}
                >
                  {m.senderName} &middot; {fmtDate(m.createdAt)}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Error */}
        {err && (
          <div
            style={{
              margin: "0 22px",
              padding: "6px 10px",
              background: "rgba(231,76,60,.1)",
              color: "#e74c3c",
              fontSize: 13,
              borderRadius: 6,
            }}
          >
            {err}
          </div>
        )}

        {/* Input */}
        {(status === "open" || role === "admin") && (
          <div
            style={{
              padding: "12px 22px 18px",
              borderTop: "1px solid var(--border-color,#2a3347)",
              display: "flex",
              gap: 8,
            }}
          >
            <textarea
              rows={2}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Type a message… (Enter to send)"
              style={{
                flex: 1,
                resize: "none",
                background: "var(--input-bg,#151c2c)",
                border: "1px solid var(--border-color,#2a3347)",
                borderRadius: 8,
                color: "var(--text-color,#e0e6f0)",
                fontSize: 14,
                padding: "8px 12px",
                outline: "none",
              }}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 6, justifyContent: "flex-end" }}>
              <input
                type="file"
                id={`thread-file-${dispute.id}`}
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                style={{ display: "none" }}
              />
              <label
                htmlFor={`thread-file-${dispute.id}`}
                style={{
                  background: file ? "rgba(46,213,115,0.2)" : "var(--input-bg,#151c2c)",
                  color: file ? "#2ed573" : "#8896a5",
                  border: "1px solid var(--border-color,#2a3347)",
                  borderRadius: 8,
                  padding: "0 12px",
                  cursor: "pointer",
                  fontSize: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 38,
                  whiteSpace: "nowrap"
                }}
              >
                {file ? "📎 Attached" : "📎 Attach"}
              </label>
              <button
                onClick={sendMessage}
                disabled={sending || (!text.trim() && !file)}
                style={{
                  background: sending || (!text.trim() && !file) ? "#3d6b9e" : "#4f9cf9",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "0 18px",
                  cursor: sending || (!text.trim() && !file) ? "not-allowed" : "pointer",
                  fontWeight: 600,
                  fontSize: 14,
                  height: 38,
                }}
              >
                {sending ? "…" : "Send"}
              </button>
            </div>
          </div>
        )}
        {status === "resolved" && role === "driver" && (
          <div
            style={{
              padding: "12px 22px 16px",
              textAlign: "center",
              fontSize: 13,
              color: "#8896a5",
              borderTop: "1px solid var(--border-color,#2a3347)",
            }}
          >
            This dispute has been resolved.
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Delete Confirmation Modal ────────────────────────────── */
const DeleteConfirmModal: React.FC<{
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}> = ({ onClose, onConfirm, loading }) => {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        zIndex: 1100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: "var(--card-bg,#1e2535)",
          borderRadius: 14,
          width: "100%",
          maxWidth: 400,
          padding: "24px",
          textAlign: "center",
          boxShadow: "0 12px 48px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{
          width: 50,
          height: 50,
          background: "rgba(255,107,107,0.1)",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 16px",
          color: "#ff6b6b"
        }}>
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </div>
        <div style={{ fontWeight: 700, fontSize: 18, color: "var(--text-color,#e0e6f0)", marginBottom: 8 }}>
          Delete Dispute?
        </div>
        <div style={{ fontSize: 14, color: "#8896a5", marginBottom: 24, lineHeight: 1.5 }}>
          This action is permanent and will remove this thread for both you and the driver.
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: 8,
              border: "1px solid var(--border-color,#2a3347)",
              background: "transparent",
              color: "var(--text-color,#e0e6f0)",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: 8,
              border: "none",
              background: "#ff6b6b",
              color: "#fff",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer"
            }}
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── New Dispute Form ────────────────────────────────────────── */
const NewDisputeForm: React.FC<{
  driverId: number;
  driverName: string;
  token: string;
  onCreated: (d: Dispute) => void;
}> = ({ driverId, driverName, token, onCreated }) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    if (!title.trim() || !content.trim()) {
      setErr("Title and message are required.");
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      const formData = new FormData();
      formData.append("driverId", String(driverId));
      formData.append("driverName", driverName);
      formData.append("title", title.trim());
      formData.append("content", content.trim());
      if (file) {
        formData.append("attachment", file);
      }

      const res = await axios.post(
        `${port}/disputes`,
        formData,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } }
      );
      onCreated(res.data);
      setTitle("");
      setContent("");
      setFile(null);
      setOpen(false);
    } catch {
      setErr("Failed to submit dispute.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ marginBottom: 20 }}>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          style={{
            background: "#4f9cf9",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "9px 20px",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Dispute
        </button>
      ) : (
        <div
          style={{
            background: "var(--card-bg,#1e2535)",
            borderRadius: 12,
            padding: "20px 22px",
            border: "1px solid var(--border-color,#2a3347)",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 14, fontSize: 15, color: "var(--text-color,#e0e6f0)" }}>
            Submit a Dispute
          </div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#8896a5", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Brief summary of your issue"
            style={{
              display: "block", width: "100%", marginTop: 5, marginBottom: 14,
              padding: "9px 12px", background: "var(--input-bg,#151c2c)",
              border: "1px solid var(--border-color,#2a3347)", borderRadius: 7,
              color: "var(--text-color,#e0e6f0)", fontSize: 14, outline: "none", boxSizing: "border-box",
            }}
          />
          <label style={{ fontSize: 12, fontWeight: 600, color: "#8896a5", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Message
          </label>
          <textarea
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Describe your complaint in detail…"
            style={{
              display: "block", width: "100%", marginTop: 5, marginBottom: 14, resize: "vertical",
              padding: "9px 12px", background: "var(--input-bg,#151c2c)",
              border: "1px solid var(--border-color,#2a3347)", borderRadius: 7,
              color: "var(--text-color,#e0e6f0)", fontSize: 14, outline: "none", boxSizing: "border-box",
            }}
          />
          <label style={{ fontSize: 12, fontWeight: 600, color: "#8896a5", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 5 }}>
            Attachment (Optional)
          </label>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            accept=".png,.jpg,.jpeg,.pdf"
            style={{
              display: "block", width: "100%", marginBottom: 14,
              color: "var(--text-color,#e0e6f0)", fontSize: 14,
            }}
          />
          {err && <div style={{ color: "#e74c3c", fontSize: 13, marginBottom: 10 }}>{err}</div>}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => { setOpen(false); setErr(null); }}
              style={{
                padding: "8px 18px", borderRadius: 7, border: "1px solid var(--border-color,#2a3347)",
                background: "transparent", color: "var(--text-color,#e0e6f0)", cursor: "pointer", fontSize: 14,
              }}
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={saving}
              style={{
                padding: "8px 22px", borderRadius: 7, border: "none",
                background: saving ? "#3d6b9e" : "#4f9cf9",
                color: "#fff", cursor: saving ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 600,
              }}
            >
              {saving ? "Submitting…" : "Submit"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Status Badge ────────────────────────────────────────────── */
const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
  <span
    style={{
      padding: "3px 10px",
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      background: status === "open" ? "rgba(255,165,0,0.15)" : "rgba(46,213,115,0.12)",
      color: status === "open" ? "#ffa502" : "#2ed573",
    }}
  >
    {status}
  </span>
);

/* ── Main DisputePage ─────────────────────────────────────────── */
const DisputePage: React.FC = () => {
  const token = useMemo(() => localStorage.getItem("token") ?? "", []);
  const role = getRole();
  const isAdmin = role === "admin";

  const driverId = Number(localStorage.getItem("driverId") ?? 0);
  const driverName =
    localStorage.getItem("fullName") ||
    localStorage.getItem("driverName") ||
    "Driver";

  const rightName =
    localStorage.getItem("firstname") ||
    localStorage.getItem("firstName") ||
    (isAdmin ? "Admin" : driverName);

  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDispute, setActiveDispute] = useState<Dispute | null>(null);
  const [disputeToDelete, setDisputeToDelete] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = isAdmin
          ? `${port}/disputes`
          : `${port}/disputes/driver/${driverId}`;
        const res = await axios.get<Dispute[]>(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDisputes(Array.isArray(res.data) ? res.data : []);
      } catch {
        setError("Failed to load disputes.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleUpdated = (updated: Dispute) => {
    setDisputes((prev) =>
      prev.map((d) => (d.id === updated.id ? updated : d))
    );
    if (activeDispute?.id === updated.id) setActiveDispute(updated);
  };

  const handleDeleteDispute = async () => {
    if (!disputeToDelete) return;
    setDeleting(true);
    try {
      await axios.delete(`${port}/disputes/${disputeToDelete}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDisputes((prev) => prev.filter((d) => d.id !== disputeToDelete));
      setDisputeToDelete(null);
    } catch {
      alert("Failed to delete dispute. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AdminLayout
      title="Disputes"
      variant={isAdmin ? "admin" : "driver"}
      rightNameOverride={rightName}
    >
      {!isAdmin && (
        <NewDisputeForm
          driverId={driverId}
          driverName={driverName}
          token={token}
          onCreated={(d) => setDisputes((prev) => [d, ...prev])}
        />
      )}

      {error && (
        <div className="alert alert-danger">{error}</div>
      )}

      {loading ? (
        <div className="card p-3">Loading disputes…</div>
      ) : disputes.length === 0 ? (
        <div
          style={{
            background: "var(--card-bg,#1e2535)",
            borderRadius: 12,
            padding: "40px 24px",
            textAlign: "center",
            color: "#8896a5",
            border: "1px dashed var(--border-color,#2a3347)",
          }}
        >
          {isAdmin ? "No disputes submitted yet." : "You have no disputes. Click \"New Dispute\" to submit one."}
        </div>
      ) : (
        <div className="card p-3">
          <table className="table table-borderless align-middle mb-0 custom-table">
            <thead>
              <tr>
                <th>#</th>
                {isAdmin && <th>Driver</th>}
                <th>Title</th>
                <th>Status</th>
                <th>Last Update</th>
                <th>Messages</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {disputes.map((d, i) => (
                <tr key={d.id}>
                  <td style={{ color: "#8896a5", fontSize: 13 }}>{i + 1}</td>
                  {isAdmin && <td style={{ fontWeight: 500 }}>{d.driverName}</td>}
                  <td style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {d.title}
                  </td>
                  <td><StatusBadge status={d.status} /></td>
                  <td style={{ fontSize: 13, color: "#8896a5" }}>{fmtDate(d.updatedAt)}</td>
                  <td style={{ textAlign: "center" }}>
                    <span
                      style={{
                        display: "inline-block",
                        background: "var(--input-bg,#151c2c)",
                        borderRadius: 20,
                        padding: "2px 10px",
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      {d.messages.length}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <button
                        onClick={() => setActiveDispute(d)}
                        style={{
                          background: "none",
                          border: "1px solid var(--border-color,#2a3347)",
                          borderRadius: 6,
                          padding: "5px 12px",
                          cursor: "pointer",
                          color: "#4f9cf9",
                          fontSize: 13,
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                        }}
                      >
                        View Thread
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => setDisputeToDelete(d.id)}
                          title="Delete Dispute"
                          style={{
                            background: "rgba(255,107,107,0.1)",
                            border: "none",
                            borderRadius: 6,
                            padding: "6px 8px",
                            cursor: "pointer",
                            color: "#ff6b6b",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeDispute && (
        <ThreadModal
          dispute={activeDispute}
          role={role as "admin" | "driver"}
          senderName={isAdmin ? (localStorage.getItem("firstname") || "Admin") : driverName}
          token={token}
          onClose={() => setActiveDispute(null)}
          onUpdated={handleUpdated}
        />
      )}

      {disputeToDelete && (
        <DeleteConfirmModal
          loading={deleting}
          onClose={() => setDisputeToDelete(null)}
          onConfirm={handleDeleteDispute}
        />
      )}
    </AdminLayout>
  );
};

export default DisputePage;
