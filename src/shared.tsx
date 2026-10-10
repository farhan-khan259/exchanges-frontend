import React, { useEffect, useState, useRef } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  Link,
  useNavigate,
  useLocation,
  Navigate,
} from "react-router-dom";
import {
  ArrowLeftRight,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRight,
  LayoutDashboard,
  Users,
  Settings,
  Plus,
  Search,
  LogOut,
  Menu,
  X,
  RefreshCw,
  Download,
  CheckCircle2,
  FileText,
  Layers,
  LockKeyhole,
} from "lucide-react";
import { Decimal } from "decimal.js";
import { request, setCsrf, fmt, when } from "./api";

export type Row = Record<string, any>;
export type Field = {
  key: string;
  label: string;
  type?: string;
  options?: { value: string; label: string }[];
  value?: any;
  required?: boolean;
  wide?: boolean;
  help?: string;
};
export function Badge({ children }: { children: any }) {
  const s = String(children);
  return (
    <span
      className={
        "badge " +
        (/SELL|VERIFIED|ACTIVE|APPROVED|RECEIVED/.test(s)
          ? "green"
          : /REJECT|BLOCK|SUSPEND/.test(s)
            ? "red"
            : /PEND|REVIEW|TRANSIT/.test(s)
              ? "amber"
              : "blue")
      }
    >
      {s.replaceAll("_", " ")}
    </span>
  );
}
export function DataView({
  rows,
  columns,
  onClick,
  actions,
}: {
  rows: Row[];
  columns: {
    key: string;
    label: string;
    render?: (r: Row) => React.ReactNode;
  }[];
  onClick?: (r: Row) => void;
  actions?: (r: Row) => React.ReactNode;
}) {
  if (!rows.length)
    return (
      <div className="empty">
        <Layers size={30} />
        <h3>No records yet</h3>
        <p>Records will appear here when your team starts working.</p>
      </div>
    );
  return (
    <div className="data-view">
      <table>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key}>{c.label}</th>
            ))}
            {actions && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id || i}>
              {columns.map((c, j) => (
                <td key={c.key} data-label={c.label}>
                  {j === 0 && onClick ? (
                    <button className="text-button" onClick={() => onClick(r)}>
                      {c.render ? c.render(r) : String(r[c.key] ?? "—")}
                    </button>
                  ) : c.render ? (
                    c.render(r)
                  ) : (
                    String(r[c.key] ?? "—")
                  )}
                </td>
              ))}
              {actions && (
                <td className="row-actions" data-label="Actions">
                  {actions(r)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    const before = document.activeElement as HTMLElement;
    const el = document.querySelector<HTMLDialogElement>("dialog");
    el?.showModal();
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", fn);
    return () => {
      document.removeEventListener("keydown", fn);
      before?.focus();
    };
  }, []);
  return (
    <dialog
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className="modal-head">
        <h2>{title}</h2>
        <button aria-label="Close" className="icon-button" onClick={onClose}>
          <X />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Form({
  fields,
  onSave,
  label = "Save changes",
  initial = {},
}: {
  fields: Field[];
  onSave: (v: Row) => Promise<void>;
  label?: string;
  initial?: Row;
}) {
  const [v, set] = useState<Row>(() =>
      Object.fromEntries(
        fields.map((f) => [f.key, initial[f.key] ?? f.value ?? ""]),
      ),
    ),
    [error, err] = useState(""),
    [busy, working] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        working(true);
        err("");
        try {
          await onSave(v);
        } catch (e) {
          err((e as Error).message);
        } finally {
          working(false);
        }
      }}
    >
      <div className="form-grid">
        {fields.map((f) => (
          <label key={f.key} className={f.wide ? "wide" : ""}>
            <span>
              {f.label}
              {f.required !== false && " *"}
            </span>
            {f.type === "select" ? (
              <select
                required={f.required !== false}
                value={v[f.key]}
                onChange={(e) => set({ ...v, [f.key]: e.target.value })}
              >
                <option value="">Select…</option>
                {f.options?.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : f.type === "file" ? (
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                required={f.required !== false}
                onChange={(e) => set({ ...v, [f.key]: e.target.files?.[0] })}
              />
            ) : f.type === "textarea" ? (
              <textarea
                required={f.required !== false}
                value={v[f.key]}
                onChange={(e) => set({ ...v, [f.key]: e.target.value })}
              />
            ) : (
              <input
                type={f.type || "text"}
                required={f.required !== false}
                value={v[f.key]}
                step="any"
                onChange={(e) => set({ ...v, [f.key]: e.target.value })}
              />
            )}{" "}
            {f.help && <small>{f.help}</small>}
          </label>
        ))}
      </div>
      {error && (
        <div className="notice error" role="alert">
          {error}
        </div>
      )}
      <div className="form-footer">
        <button className="primary" disabled={busy}>
          {busy ? "Saving…" : label}
          <ArrowRight size={16} />
        </button>
      </div>
    </form>
  );
}
export function useData(path: string, version = 0) {
  const [response, setResponse] = useState<{
    path: string;
    version: number;
    data: any;
    error: string;
  } | null>(null);
  useEffect(() => {
    let alive = true;
    request(path)
      .then((data) => {
        if (alive) setResponse({ path, version, data, error: "" });
      })
      .catch((e) => {
        if (alive) setResponse({ path, version, data: null, error: e.message });
      });
    return () => {
      alive = false;
    };
  }, [path, version]);
  const current =
    response?.path === path && response.version === version ? response : null;
  return { data: current?.data ?? null, error: current?.error ?? "" };
}
export function Load({ error }: { error?: string }) {
  return error ? (
    <div className="notice error" role="alert">
      {error}
    </div>
  ) : (
    <div className="loading">
      <RefreshCw className="spin" size={20} />
      Loading…
    </div>
  );
}
