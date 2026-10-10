import { Decimal } from "decimal.js";
import { activate, selectAccount, localRequest, offlineIdentity, remote, signOut, NetworkFault, ApiFault } from "./offline";
export let csrf = "";
export function setCsrf(v: string) {
  csrf = v;
}
export async function request(path: string, method = "GET", body?: unknown, key?: string) {
  if (path === "/auth/logout") {
    await signOut();
    try { return await remote(path, method, body, csrf); } catch { return { ok: true }; }
  }
  if (path === "/auth/me") {
    try {
      if (!navigator.onLine) throw new NetworkFault("Offline");
      const r = await remote(path);
      await selectAccount(r.user); if (!r.user.platformAdmin) void activate(r.user);
      return r;
    } catch (e) {
      if (e instanceof NetworkFault || (e instanceof ApiFault && e.status >= 500)) {
        const saved = await offlineIdentity();
        if (saved) return saved;
      }
      throw e;
    }
  }
  if (!path.startsWith("/auth/") && !path.startsWith("/admin/")) {
    const local = await localRequest(path, method, body, key);
    if (local !== undefined) return local;
  }
  const value = await remote(path, method, body, csrf, key);
  if (path === "/auth/login") { setCsrf(value.csrf); await selectAccount(value.user); if (!value.user.platformAdmin) void activate(value.user); }
  return value;
}
export const fmt = (v: unknown, decimals = 2) => {
  try {
    const [integer, fraction] = new Decimal(String(v || 0))
      .toFixed(decimals)
      .split(".");
    return (
      integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",") +
      (fraction ? "." + fraction : "")
    );
  } catch {
    return "0";
  }
};
export const when = (v: string) =>
  new Date(v).toLocaleString("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
