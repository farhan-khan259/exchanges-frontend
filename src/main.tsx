import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  Link,
  useNavigate,
  useParams,
  Navigate,
} from "react-router-dom";
import {
  Home,
  Users,
  Layers,
  Menu,
  Plus,
  LogOut,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  ChevronRight,
  Search,
  Download,
  CheckCircle2,
} from "lucide-react";
import { Decimal } from "decimal.js";
import { request, setCsrf, fmt, when } from "./api";
import { Form, Modal, Load, useData, type Row, type Field } from "./shared";
import { AdminPanel } from "./admin";
import { Reports } from "./reports";
import { OfflinePanel } from "./offline-panel";
import { isSyncing, startOffline } from "./offline";
import "./offline.css";
import "./style.css";
import "./khata.css";
const text = {
  en: {
    home: "Home",
    khata: "Party Khata",
    stock: "Currency Stock",
    more: "More",
    give: "Give Currency",
    receive: "Receive PKR",
    addParty: "Add Party",
    addStock: "Opening Stock",
    due: "PKR to Receive",
    name: "Party Name",
    phone: "Mobile Number",
    notes: "Notes",
    quantity: "Currency Amount",
    rate: "Stock Rate (PKR)",
    currency: "Currency",
    save: "Save Record",
    search: "Search name or mobile",
    balance: "PKR Balance",
    empty: "No records yet",
    back: "Back",
    payment: "PKR Payment",
    amount: "PKR Amount",
    statement: "Statement",
    stockCost: "Stock Cost (PKR)",
    history: "History",
    welcome: "Your stock. Your khata.",
    subtitle: "Simple currency stock and customer balances.",
    newRecord: "New Record",
    today: "Payments received today",
    settings: "Business Settings",
    signout: "Sign Out",
    language: "Language",
    reverse: "Reverse Entry",
    reason: "Reason for correction",
    stockHelp:
      "Opening stock does not move cash. Use Buy Currency for customer purchases and PKR payment. Stock uses average acquisition cost.",
    confirm:
      "Check the amount before saving. Stock decreases and PKR is added to this party’s khata.",
    newParty: "New party",
    existing: "Existing party",
    stockRemaining: "Available stock",
    noDue: "Khata is settled",
    received: "PKR Received",
    given: "Currency Given",
    reversal: "Correction",
    reversed: "Reversed",
    receipt: "Receipt",
    refresh: "Refresh",
    stockValue: "Currency Stock Value",
    parties: "Parties",
    manage: "Manage your business",
    audit: "Activity Log",
  },
  ur: {
    home: "ہوم",
    khata: "پارٹی کھاتہ",
    stock: "کرنسی اسٹاک",
    more: "مزید",
    give: "کرنسی دیں",
    receive: "PKR وصول کریں",
    addParty: "پارٹی شامل کریں",
    addStock: "اسٹاک شامل کریں",
    due: "وصول کرنے ہیں (PKR)",
    name: "پارٹی کا نام",
    phone: "موبائل نمبر",
    notes: "تفصیل",
    quantity: "کرنسی کی مقدار",
    rate: "اسٹاک ریٹ (PKR)",
    currency: "کرنسی",
    save: "ریکارڈ محفوظ کریں",
    search: "نام یا موبائل تلاش کریں",
    balance: "PKR بقایا",
    empty: "ابھی کوئی ریکارڈ نہیں",
    back: "واپس",
    payment: "PKR ادائیگی",
    amount: "PKR رقم",
    statement: "کھاتہ اسٹیٹمنٹ",
    stockCost: "اسٹاک کی قیمت (PKR)",
    history: "ریکارڈ",
    welcome: "آپ کا اسٹاک۔ آپ کا کھاتہ۔",
    subtitle: "کرنسی اسٹاک اور پارٹی کا آسان حساب۔",
    newRecord: "نیا ریکارڈ",
    today: "آج وصول ہونے والی رقم",
    settings: "کاروبار کی تفصیل",
    signout: "لاگ آؤٹ",
    language: "زبان",
    reverse: "ریکارڈ واپس کریں",
    reason: "درستگی کی وجہ",
    stockHelp:
      "نیا اسٹاک آنے پر اوسط ریٹ ہوگا۔ پرانے ریکارڈ کا ریٹ تبدیل نہیں ہوگا۔",
    confirm:
      "محفوظ کرنے سے پہلے رقم چیک کریں۔ اسٹاک کم ہوگا اور پارٹی کے کھاتے میں PKR شامل ہوں گے۔",
    newParty: "نئی پارٹی",
    existing: "موجودہ پارٹی",
    stockRemaining: "دستیاب اسٹاک",
    noDue: "کھاتہ مکمل ادا ہوگیا",
    received: "PKR وصول ہوئے",
    given: "کرنسی دی گئی",
    reversal: "درستگی",
    reversed: "واپس کیا گیا",
    receipt: "رسید",
    refresh: "دوبارہ لوڈ",
    stockValue: "اسٹاک کی قیمت",
    parties: "پارٹیاں",
    manage: "اپنے کاروبار کا حساب",
    audit: "سرگرمیوں کا ریکارڈ",
  },
  roman: {
    home: "Home",
    khata: "Party Khata",
    stock: "Currency Stock",
    more: "Mazeed",
    give: "Currency Dein",
    receive: "PKR Wasool Karein",
    addParty: "Party Shamil Karein",
    addStock: "Stock Shamil Karein",
    due: "PKR Lena Hai",
    name: "Party Ka Naam",
    phone: "Mobile Number",
    notes: "Tafseel",
    quantity: "Currency Ki Miqdaar",
    rate: "Stock Rate (PKR)",
    currency: "Currency",
    save: "Record Save Karein",
    search: "Naam ya mobile talash karein",
    balance: "PKR Baqi",
    empty: "Abhi koi record nahi",
    back: "Wapas",
    payment: "PKR Payment",
    amount: "PKR Raqam",
    statement: "Khata Statement",
    stockCost: "Stock Ki Qeemat (PKR)",
    history: "Record",
    welcome: "Aap ka stock. Aap ka khata.",
    subtitle: "Currency stock aur party ka asaan hisaab.",
    newRecord: "Naya Record",
    today: "Aaj Wasool Hue",
    settings: "Karobar Ki Tafseel",
    signout: "Logout",
    language: "Zabaan",
    reverse: "Record Wapas Karein",
    reason: "Durustgi Ki Wajah",
    stockHelp:
      "Naya stock aane par average rate hoga. Purane record ka rate nahi badlega.",
    confirm:
      "Save karne se pehle raqam check karein. Stock kam hoga aur party ke khatay mein PKR shamil honge.",
    newParty: "Nayi Party",
    existing: "Maujooda Party",
    stockRemaining: "Maujooda Stock",
    noDue: "Khata clear hai",
    received: "PKR Wasool Hue",
    given: "Currency Di Gayi",
    reversal: "Durustgi",
    reversed: "Wapas Kiya",
    receipt: "Receipt",
    refresh: "Dobara Load",
    stockValue: "Stock Ki Qeemat",
    parties: "Parties",
    manage: "Apne karobar ka hisaab",
    audit: "Activity Record",
  },
};
type Locale = keyof typeof text;
type T = typeof text.en;
export type Context = {
  t: T;
  user: Row;
  version: number;
  boot: Row;
  refresh: () => void;
  notify: (s: string) => void;
  openGive: (id?: string) => void;
  openBuy: (id?: string) => void;
  can: (p: string) => boolean;
};
function rate(p: Row) {
  return new Decimal(String(p.quantity)).gt(0)
    ? new Decimal(String(p.cost)).div(String(p.quantity)).toFixed(8)
    : "0";
}
const noteField = (t: T): Field => ({
  key: "note",
  label: t.notes,
  type: "textarea",
  required: false,
  wide: true,
});
function Pager({
  data,
  page,
  set,
}: {
  data: Row;
  page: number;
  set: (n: number) => void;
}) {
  return (
    <div className="pager">
      <button disabled={page <= 1} onClick={() => set(page - 1)}>
        ‹
      </button>
      <span>
        {page} / {Math.max(1, Math.ceil(data.total / 20))}
      </span>
      <button disabled={page * 20 >= data.total} onClick={() => set(page + 1)}>
        ›
      </button>
    </div>
  );
}
function App() {
  const [user, setUser] = useState<Row | null>(null),
    [ready, setReady] = useState(false),
    [version, setVersion] = useState(0),
    [toast, setToast] = useState(""),
    [give, setGive] = useState<string | null>(null),
    [locale, setLocale] = useState<Locale>(() => {
      const v = localStorage.getItem("khata-locale");
      return v === "ur" || v === "roman" ? v : "en";
    });
  const nav = useNavigate();
  const t = text[locale];
  const notify = (s: string) => {
    setToast(s);
    setTimeout(() => setToast(""), 5000);
  };
  const refresh = () => setVersion((v) => v + 1);
  const fresh = async () => {
    const r = await request("/auth/me");
    setCsrf(r.csrf);
    setUser(r.user);
  };
  useEffect(() => {
    startOffline();
    const refreshLocal = () => { if (!isSyncing()) refresh(); };
    const requireLogin = () => setUser(null);
    window.addEventListener("khata-offline-changed", refreshLocal);
    window.addEventListener("khata-auth-required", requireLogin);
    return () => { window.removeEventListener("khata-offline-changed", refreshLocal); window.removeEventListener("khata-auth-required", requireLogin); };
  }, []);
  useEffect(() => {
    fresh()
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);
  useEffect(() => {
    document.documentElement.dir = locale === "ur" ? "rtl" : "ltr";
    document.documentElement.lang = locale === "ur" ? "ur" : "en";
    localStorage.setItem("khata-locale", locale);
  }, [locale]);
  const { data: boot, error } = useData(
    user && !user.platformAdmin && !user.mustChangePassword
      ? "/bootstrap"
      : "/auth/me",
    version,
  );
  if (!ready) return <Load />;
  if (!user)
    return (
      <div className="login">
        <div className="login-story">
          <div className="wordmark">
            Khata<span>OS</span>
          </div>
          <div>
            <p className="eyebrow">AHMED SOLUTIONS</p>
            <h1>
              Simple stock.
              <br />
              Clear khata.
            </h1>
            <p>
              Keep currency stock and customer payments in one easy workspace.
            </p>
          </div>
          <small>For mobile and desktop</small>
        </div>
        <div className="login-form">
          <h2>
            {window.location.pathname === "/admin"
              ? "Ahmed Solutions Admin"
              : "Welcome back"}
          </h2>
          <p>Sign in to your business account.</p>
          <Form
            fields={[
              { key: "email", label: "Email", type: "email", wide: true },
              {
                key: "password",
                label: "Password",
                type: "password",
                wide: true,
              },
            ]}
            label="Sign in"
            onSave={async (v) => {
              const r = await request("/auth/login", "POST", v);
              setCsrf(r.csrf);
              setUser(r.user);
              nav(r.user.platformAdmin ? "/admin" : "/");
            }}
          />
          <p className="help-note">
            Accounts are issued by Ahmed Solutions. Ask your administrator if
            you need access.
          </p>
          <Link
            className="admin-login-link"
            to={window.location.pathname === "/admin" ? "/" : "/admin"}
          >
            {window.location.pathname === "/admin"
              ? "Business Login"
              : "Administrator Access"}
          </Link>
        </div>
      </div>
    );
  if (user.mustChangePassword)
    return (
      <div className="password-page">
        <h2>Choose your password</h2>
        <p>Use at least 12 characters.</p>
        <Form
          fields={[
            {
              key: "currentPassword",
              label: "Temporary password",
              type: "password",
              wide: true,
            },
            {
              key: "password",
              label: "New password",
              type: "password",
              wide: true,
            },
          ]}
          onSave={async (v) => {
            await request("/auth/change-password", "POST", v);
            await fresh();
          }}
        />
      </div>
    );
  const can = (p: string) => user.permissions?.includes(p);
  const c: Context = {
    t,
    user,
    version,
    boot: boot || {},
    refresh,
    notify,
    openGive: (id = "") => setGive(id),
    openBuy: (id = "") => setGive("BUY:" + id),
    can,
  };
  const links = [
    { path: "/", label: t.home, icon: Home },
    { path: "/parties", label: t.khata, icon: Users },
    { path: "/stock", label: t.stock, icon: Layers },
    { path: "/more", label: t.more, icon: Menu },
  ];
  return (
    <div className="khata-shell">
      <aside className="khata-sidebar">
        <Link to="/" className="khata-brand">
          <span>K</span>Khata<b>OS</b>
        </Link>
        <p className="sidebar-caption">AHMED SOLUTIONS</p>
        {!user.platformAdmin &&
          links.map((l) => (
            <NavLink key={l.path} end={l.path === "/"} to={l.path}>
              <l.icon size={20} />
              {l.label}
            </NavLink>
          ))}
        {user.platformAdmin && (
          <NavLink to="/admin">Accounts &amp; Access</NavLink>
        )}
        <div className="sidebar-bottom">
          <small>{user.name}</small>
          <button
            onClick={async () => {
              await request("/auth/logout", "POST");
              setUser(null);
              setCsrf("");
              nav("/");
            }}
          >
            <LogOut size={16} />
            {t.signout}
          </button>
        </div>
      </aside>
      <main className="khata-main">
        <header className="khata-header">
          <Link to="/" className="mobile-brand">
            Khata<b>OS</b>
          </Link>
          <span className="business-title">
            {boot?.settings?.legalName || "Ahmed Solutions"}
          </span>
          <div className="header-tools">
            <select
              aria-label={t.language}
              value={locale}
              onChange={(e) => setLocale(e.target.value as Locale)}
            >
              <option value="en">English</option>
              <option value="ur">اردو</option>
              <option value="roman">Roman Urdu</option>
            </select>
            {!user.platformAdmin && can("transaction.create") && (
              <button className="primary" onClick={() => setGive("")}>
                <Plus size={18} />
                <span>{t.newRecord}</span>
              </button>
            )}
            <button
              className="mobile-logout"
              aria-label={t.signout}
              onClick={async () => {
                await request("/auth/logout", "POST");
                setUser(null);
                setCsrf("");
              }}
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>
        {!user.platformAdmin && <OfflinePanel user={user} />}
        <div className="khata-content">
          {user.platformAdmin ? (
            <Routes>
              <Route path="/admin" element={<AdminPanel notify={notify} />} />
              <Route path="*" element={<Navigate to="/admin" />} />
            </Routes>
          ) : error ? (
            <Load error={error} />
          ) : !boot ? (
            <Load />
          ) : (
            <Routes>
              <Route path="/" element={<Dashboard c={c} />} />
              <Route path="/parties" element={<Parties c={c} />} />
              <Route path="/parties/:id" element={<Party c={c} />} />
              <Route path="/stock" element={<Stock c={c} />} />
              <Route path="/more" element={<More c={c} />} />
              <Route path="/cash" element={<Cash c={c} />} />
              <Route path="/reports" element={<Reports c={c} />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          )}
        </div>
      </main>
      {!user.platformAdmin && (
        <nav className="khata-bottom">
          {links.map((l) => (
            <NavLink key={l.path} end={l.path === "/"} to={l.path}>
              <l.icon size={21} />
              <span>{l.label}</span>
            </NavLink>
          ))}
        </nav>
      )}
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={18} />
          {toast}
        </div>
      )}
      {give !== null && (
        <Give
          c={c}
          initialParty={give.startsWith("BUY:") ? give.slice(4) : give}
          initialMode={give.startsWith("BUY:") ? "BUY" : "SELL"}
          close={() => setGive(null)}
        />
      )}
    </div>
  );
}
function Dashboard({ c }: { c: Context }) {
  const { data, error } = useData("/dashboard", c.version),
    t = c.t;
  if (!data) return <Load error={error} />;
  return (
    <>
      <div className="khata-heading">
        <div>
          <p className="eyebrow">KHATA OS</p>
          <h1>{t.welcome}</h1>
          <p>{t.subtitle}</p>
        </div>
      </div>
      <div className="khata-stats">
        <div className="due-card">
          <Wallet />
          <small>PKR Cash Balance</small>
          <strong className="numeric">PKR {fmt(data.cash)}</strong>
          <Link to="/cash">
            Cash Ledger
            <ChevronRight size={18} />
          </Link>
        </div>
        <div className="stat-card">
          <div className="due-card-inner">
            <Wallet />
            <small>{t.due}</small>
            <strong>
              <span>PKR</span> {fmt(data.due)}
            </strong>
            <Link to="/parties">
              {t.khata}
              <ChevronRight size={18} />
            </Link>
          </div>
        </div>
        <div className="stat-card">
          <ArrowDownLeft />
          <small>{t.today}</small>
          <strong>PKR {fmt(data.received)}</strong>
        </div>
        <div className="stat-card">
          <Users />
          <small>{t.parties}</small>
          <strong>{data.parties}</strong>
        </div>
      </div>
      <div className="quick-actions">
        {c.can("transaction.create") && (
          <>
            <button className="primary" onClick={() => c.openGive()}>
              <ArrowUpRight />
              Sell Currency
            </button>
            <button className="button" onClick={() => c.openBuy()}>
              <ArrowDownLeft />
              Buy Currency
            </button>
          </>
        )}
        <Link className="button" to="/parties">
          <ArrowDownLeft />
          {t.receive}
        </Link>
        <Link className="button" to="/stock">
          <Plus />
          {t.addStock}
        </Link>
      </div>
      <Section title={t.stock} link="/stock" />
      <StockCards rows={data.stock} t={t} />
      <Section title={t.history} />
      <div className="ledger-list">
        {data.recent.length ? (
          data.recent.map((e: Row) => (
            <Link
              key={e.id}
              to={"/parties/" + e.partyId}
              className="ledger-card"
            >
              <div
                className={
                  "movement-icon " + (e.kind === "PKR_RECEIVED" ? "inflow" : "")
                }
              >
                <Wallet size={18} />
              </div>
              <div className="ledger-body">
                <strong>
                  {e.currencyCode
                    ? `${fmt(e.foreignAmount, 4)} ${e.currencyCode}`
                    : t.payment}
                </strong>
                <small>
                  {kind(e, t)} · {when(e.createdAt)}
                </small>
              </div>
              <strong className="numeric">
                PKR{" "}
                {fmt(new Decimal(e.pkrAmount || e.pkrDelta).abs().toString())}
              </strong>
            </Link>
          ))
        ) : (
          <Empty t={t} />
        )}
      </div>
    </>
  );
}
function Section({ title, link }: { title: string; link?: string }) {
  return (
    <div className="section-heading">
      <h2>{title}</h2>
      {link && (
        <Link to={link}>
          <ChevronRight size={20} />
        </Link>
      )}
    </div>
  );
}
function Empty({ t }: { t: T }) {
  return (
    <div className="khata-empty">
      <Layers size={30} />
      <p>{t.empty}</p>
    </div>
  );
}
function StockCards({ rows, t }: { rows: Row[]; t: T }) {
  return (
    <div className="stock-grid">
      {rows.length ? (
        rows.map((p) => (
          <div className="currency-card" key={p.id}>
            <div className="currency-top">
              <span className="currency-code">{p.currencyCode}</span>
              <span
                className={
                  new Decimal(p.quantity).gt(0)
                    ? "stock-dot"
                    : "stock-dot empty-dot"
                }
              ></span>
            </div>
            <strong className="stock-quantity numeric">
              {fmt(p.quantity, 4)}
            </strong>
            <small>{t.stockRemaining}</small>
            <div className="currency-footer">
              <span>{t.rate}</span>
              <b className="numeric">{fmt(rate(p), 4)}</b>
            </div>
            <div className="currency-footer">
              <span>{t.stockCost}</span>
              <b className="numeric">{fmt(p.cost)}</b>
            </div>
          </div>
        ))
      ) : (
        <Empty t={t} />
      )}
    </div>
  );
}
function Parties({ c }: { c: Context }) {
  const [search, setSearch] = useState(""),
    [query, setQuery] = useState(""),
    [page, setPage] = useState(1),
    [modal, setModal] = useState(false);
  const t = c.t;
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search);
      setPage(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);
  const { data, error } = useData(
    `/parties?search=${encodeURIComponent(query)}&page=${page}`,
    c.version,
  );
  return (
    <>
      <div className="khata-heading">
        <h1>{t.khata}</h1>
        {c.can("customer.write") && (
          <button className="primary" onClick={() => setModal(true)}>
            <Plus size={18} />
            {t.addParty}
          </button>
        )}
      </div>
      <label className="khata-search">
        <Search size={20} />
        <input
          aria-label={t.search}
          placeholder={t.search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </label>
      {!data ? (
        <Load error={error} />
      ) : (
        <>
          <div className="party-grid">
            {data.rows.length ? (
              data.rows.map((p: Row) => (
                <Link to={"/parties/" + p.id} key={p.id} className="party-card">
                  <div className="party-avatar">
                    {p.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="party-summary">
                    <strong>{p.name}</strong>
                    <small>{p.mobile || "—"}</small>
                  </div>
                  <div className="party-due">
                    <small>{t.due}</small>
                    <strong className="numeric">{fmt(p.balance)}</strong>
                    <small>PKR</small>
                  </div>
                  <ChevronRight size={18} />
                </Link>
              ))
            ) : (
              <Empty t={t} />
            )}
          </div>
          <Pager data={data} page={page} set={setPage} />
        </>
      )}
      {modal && (
        <Modal title={t.addParty} onClose={() => setModal(false)}>
          <Form
            fields={partyFields(t)}
            label={t.save}
            onSave={async (v) => {
              await request("/parties", "POST", v);
              setModal(false);
              c.refresh();
              c.notify(t.save);
            }}
          />
        </Modal>
      )}
    </>
  );
}
function partyFields(t: T): Field[] {
  return [
    { key: "name", label: t.name, wide: true },
    { key: "mobile", label: t.phone, type: "tel", required: false, wide: true },
    {
      key: "identityType",
      label: "Identity Type (Optional)",
      type: "select",
      required: false,
      value: "",
      options: [
        { value: "", label: "None" },
        { value: "CNIC", label: "CNIC" },
        { value: "NICOP", label: "NICOP" },
        { value: "PASSPORT", label: "Passport" },
      ],
    },
    { key: "identityNo", label: "Identity Number (Optional)", required: false },
    {
      key: "notes",
      label: t.notes,
      type: "textarea",
      required: false,
      wide: true,
    },
  ];
}
function kind(e: Row, t: T) {
  return e.kind === "FX_GIVEN"
    ? t.given
    : e.kind === "PKR_RECEIVED"
      ? t.received
      : e.kind === "FX_PURCHASED"
        ? "Currency Purchased"
        : t.reversal;
}
function Party({ c }: { c: Context }) {
  const { id } = useParams(),
    [page, setPage] = useState(1),
    [modal, setModal] = useState(""),
    [reverse, setReverse] = useState<Row | null>(null),
    [key, setKey] = useState(() => crypto.randomUUID());
  const t = c.t,
    { data, error } = useData(`/parties/${id}?page=${page}`, c.version);
  useEffect(() => {
    setPage(1);
  }, [id]);
  if (!data) return <Load error={error} />;
  return (
    <>
      <Link className="back-link" to="/parties">
        ‹ {t.back}
      </Link>
      <div className="khata-heading">
        <div>
          <h1>{data.party.name}</h1>
          <p>{data.party.mobile}</p>
        </div>
        {c.can("customer.write") && (
          <button onClick={() => setModal("edit")}>Edit</button>
        )}
      </div>
      <div className="party-balance">
        <small>{t.due}</small>
        <strong className="numeric">PKR {fmt(data.balance)}</strong>
        {new Decimal(data.balance).eq(0) && <span>{t.noDue}</span>}
      </div>
      <div className="quick-actions">
        {c.can("transaction.create") && (
          <>
            <button className="primary" onClick={() => c.openGive(id)}>
              <ArrowUpRight />
              Sell Currency
            </button>
            <button className="button" onClick={() => c.openBuy(id)}>
              <ArrowDownLeft />
              Buy Currency
            </button>
            <button
              className="receive-button"
              disabled={new Decimal(data.balance).lte(0)}
              onClick={() => {
                setKey(crypto.randomUUID());
                setModal("pay");
              }}
            >
              <ArrowDownLeft />
              {t.receive}
            </button>
          </>
        )}
        {c.can("report.read") && (
          <>
            <a
              className="button"
              target="_blank"
              rel="noopener"
              href={`/api/parties/${id}/export`}
            >
              <Download size={16} />
              {t.statement} PDF
            </a>
            <a
              className="button"
              href={`/api/parties/${id}/export?format=xlsx`}
            >
              Excel
            </a>
          </>
        )}
      </div>
      {data.party.notes && <p className="help-note">{data.party.notes}</p>}
      <Section title={t.history} />
      <div className="ledger-list">
        {data.rows.length ? (
          data.rows.map((e: Row) => (
            <article
              key={e.id}
              className={
                "ledger-card " + (e.reversedBy ? "entry-reversed" : "")
              }
            >
              <div
                className={
                  "movement-icon " + (e.kind === "PKR_RECEIVED" ? "inflow" : "")
                }
              >
                <Wallet size={20} />
              </div>
              <div className="ledger-body">
                <strong>
                  {kind(e, t)}{" "}
                  {e.reversedBy && (
                    <span className="reversed-tag">{t.reversed}</span>
                  )}
                </strong>
                <small>
                  {when(e.createdAt)} · {e.reference}
                </small>
                {e.currencyCode && (
                  <p className="numeric">
                    {fmt(e.foreignAmount, 4)} {e.currencyCode} ×{" "}
                    {fmt(e.rate, 8)} PKR
                  </p>
                )}
                {e.note && <p>{e.note}</p>}
                <div className="record-actions">
                  <a
                    target="_blank"
                    rel="noopener"
                    href={`/api/entries/${e.id}/receipt`}
                  >
                    {t.receipt} · A4
                  </a>
                  <a
                    target="_blank"
                    rel="noopener"
                    href={`/api/entries/${e.id}/receipt?size=thermal`}
                  >
                    80mm
                  </a>
                  {c.can("settings.write") &&
                    e.kind !== "REVERSAL" &&
                    !e.reversedBy && (
                      <button
                        onClick={() => {
                          setKey(crypto.randomUUID());
                          setReverse(e);
                        }}
                      >
                        {t.reverse}
                      </button>
                    )}
                </div>
              </div>
              <div className="ledger-amount">
                <strong
                  className={
                    "numeric " +
                    (new Decimal(e.pkrDelta).lt(0) ? "amount-in" : "")
                  }
                >
                  {fmt(e.pkrAmount || new Decimal(e.pkrDelta).abs().toString())}{" "}
                  PKR
                </strong>
                <small>
                  {e.paymentMode === "CASH"
                    ? "Cash paid / received · "
                    : "On khata · "}
                  {t.balance}:{" "}
                  <span className="numeric">{fmt(e.balanceAfter)}</span>
                </small>
              </div>
            </article>
          ))
        ) : (
          <Empty t={t} />
        )}
      </div>
      <Pager data={data} page={page} set={setPage} />
      {modal === "pay" && (
        <Modal title={t.receive} onClose={() => setModal("")}>
          <p>
            {data.party.name} · {t.due}: PKR {fmt(data.balance)}
          </p>
          <Form
            fields={[
              { key: "amount", label: t.amount, type: "number", wide: true },
              noteField(t),
            ]}
            label={t.save}
            onSave={async (v) => {
              await request("/payments", "POST", { ...v, partyId: id }, key);
              setModal("");
              c.refresh();
              c.notify(t.received);
            }}
          />
        </Modal>
      )}
      {modal === "edit" && (
        <Modal title={t.name} onClose={() => setModal("")}>
          <Form
            fields={partyFields(t)}
            initial={data.party}
            label={t.save}
            onSave={async (v) => {
              await request("/parties/" + id, "PATCH", v);
              setModal("");
              c.refresh();
            }}
          />
        </Modal>
      )}
      {reverse && (
        <Modal title={t.reverse} onClose={() => setReverse(null)}>
          <p>
            {reverse.reference} · PKR {fmt(reverse.pkrDelta)}
          </p>
          <p className="help-note">
            This creates a linked correction record. The original remains in
            history.
          </p>
          <Form
            fields={[
              { key: "reason", label: t.reason, type: "textarea", wide: true },
            ]}
            label={t.reverse}
            onSave={async (v) => {
              await request(`/entries/${reverse.id}/reverse`, "POST", v, key);
              setReverse(null);
              c.refresh();
              c.notify(t.reversal);
            }}
          />
        </Modal>
      )}
    </>
  );
}
function Give({
  c,
  initialParty,
  initialMode = "SELL",
  close,
}: {
  c: Context;
  initialParty: string;
  initialMode?: "BUY" | "SELL";
  close: () => void;
}) {
  const t = c.t,
    { data: stock, error } = useData("/stock", c.version);
  const [mode, setMode] = useState<"BUY" | "SELL">(initialMode),
    [newParty, setNewParty] = useState(false),
    [search, setSearch] = useState(""),
    [partyId, setParty] = useState(initialParty),
    [currency, setCurrency] = useState(""),
    [quantity, setQuantity] = useState(""),
    [rateInput, setRate] = useState(""),
    [paymentMode, setPaymentMode] = useState("CREDIT"),
    [name, setName] = useState(""),
    [mobile, setMobile] = useState(""),
    [identityType, setIdentityType] = useState(""),
    [identityNo, setIdentityNo] = useState(""),
    [note, setNote] = useState(""),
    [busy, setBusy] = useState(false),
    [err, setError] = useState(""),
    [key, setKey] = useState(() => crypto.randomUUID());
  const { data: parties } = useData(
    "/parties?search=" + encodeURIComponent(search),
    c.version,
  );
  const selected = stock?.find((p: Row) => p.currencyCode === currency);
  let total = "0",
    profit = "0";
  try {
    total = new Decimal(quantity || 0).mul(rateInput || 0).toFixed(2);
    profit = selected
      ? new Decimal(total)
          .minus(new Decimal(quantity || 0).mul(rate(selected)))
          .toFixed(2)
      : "0";
  } catch {}
  return (
    <Modal
      title={
        mode === "BUY"
          ? "Buy Currency from Customer"
          : "Sell Currency to Customer"
      }
      onClose={close}
    >
      {!stock ? (
        <Load error={error} />
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            try {
              const body = {
                ...(newParty
                  ? { newParty: { name, mobile, identityType, identityNo } }
                  : { partyId }),
                currencyCode: currency,
                quantity,
                note,
                ...(mode === "BUY"
                  ? { rate: rateInput }
                  : {
                      quotedRate: rate(selected),
                      saleRate: rateInput,
                      paymentMode,
                    }),
              };
              await request(
                mode === "BUY" ? "/buy" : "/give",
                "POST",
                body,
                key,
              );
              close();
              c.refresh();
              c.notify(
                mode === "BUY"
                  ? "Purchase saved. Stock increased and PKR cash deducted."
                  : "Sale saved. Stock and customer record updated.",
              );
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="segmented">
            <button
              type="button"
              className={mode === "SELL" ? "selected" : ""}
              onClick={() => {
                setMode("SELL");
                setKey(crypto.randomUUID());
                setRate(selected ? rate(selected) : "");
              }}
            >
              Sell Currency
            </button>
            <button
              type="button"
              className={mode === "BUY" ? "selected" : ""}
              onClick={() => {
                setMode("BUY");
                setKey(crypto.randomUUID());
                setRate("");
              }}
            >
              Buy Currency
            </button>
          </div>
          <div className="segmented">
            <button
              type="button"
              className={!newParty ? "selected" : ""}
              onClick={() => setNewParty(false)}
            >
              {t.existing}
            </button>
            <button
              type="button"
              className={newParty ? "selected" : ""}
              disabled={!c.can("customer.write")}
              onClick={() => setNewParty(true)}
            >
              {t.newParty}
            </button>
          </div>
          <div className="form-grid">
            {newParty ? (
              <>
                <label className="wide">
                  {t.name}
                  <input
                    required
                    minLength={2}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </label>
                <label className="wide">
                  {t.phone}
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                  />
                </label>
                <label>
                  Identity Type (Optional)
                  <select
                    value={identityType}
                    onChange={(e) => setIdentityType(e.target.value)}
                  >
                    <option value="">None</option>
                    <option value="CNIC">CNIC</option>
                    <option value="NICOP">NICOP</option>
                    <option value="PASSPORT">Passport</option>
                  </select>
                </label>
                <label>
                  Identity Number (Optional)
                  <input
                    maxLength={30}
                    value={identityNo}
                    onChange={(e) => setIdentityNo(e.target.value)}
                  />
                </label>
              </>
            ) : (
              <>
                <label className="wide">
                  {t.search}
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </label>
                <label className="wide">
                  {t.khata}
                  <select
                    required
                    value={partyId}
                    onChange={(e) => setParty(e.target.value)}
                  >
                    <option value="">Select…</option>
                    {initialParty &&
                      !parties?.rows.some(
                        (p: Row) => p.id === initialParty,
                      ) && <option value={initialParty}>Selected party</option>}
                    {parties?.rows.map((p: Row) => (
                      <option key={p.id} value={p.id}>
                        {p.name} · {p.mobile}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            )}
            <label>
              {t.currency}
              <select
                required
                value={currency}
                onChange={(e) => {
                  setCurrency(e.target.value);
                  const p = stock.find(
                    (p: Row) => p.currencyCode === e.target.value,
                  );
                  setRate(mode === "SELL" && p ? rate(p) : "");
                }}
              >
                <option value="">Select…</option>
                {(mode === "BUY"
                  ? c.boot.currencies
                  : stock
                      .filter((p: Row) => new Decimal(p.quantity).gt(0))
                      .map((p: Row) => ({ code: p.currencyCode }))
                ).map((p: Row) => (
                  <option value={p.code} key={p.code}>
                    {p.code}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t.quantity}
              <input
                required
                type="number"
                min="0.0001"
                step="0.0001"
                max={mode === "SELL" ? selected?.quantity : undefined}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </label>
            <label className="wide">
              {mode === "BUY" ? "Purchase Rate (PKR)" : "Selling Rate (PKR)"}
              <input
                required
                type="number"
                step="0.00000001"
                min="0.00000001"
                value={rateInput}
                onChange={(e) => setRate(e.target.value)}
              />
            </label>
            {mode === "SELL" && (
              <label className="wide">
                Payment
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                >
                  <option value="CREDIT">Khata — PKR to receive later</option>
                  <option value="CASH">Cash — PKR received now</option>
                </select>
              </label>
            )}
            <div className="wide quote-card">
              {selected && (
                <div>
                  <span>{t.stockRemaining}</span>
                  <b className="numeric">
                    {fmt(selected.quantity, 4)} {currency}
                  </b>
                </div>
              )}
              {mode === "SELL" && selected && (
                <div>
                  <span>Average purchase cost</span>
                  <b className="numeric">PKR {fmt(rate(selected), 4)}</b>
                </div>
              )}
              <div className="quote-total">
                <span>
                  {mode === "BUY"
                    ? "PKR to Pay"
                    : paymentMode === "CASH"
                      ? "PKR Received"
                      : t.due}
                </span>
                <b className="numeric">PKR {fmt(total)}</b>
              </div>
              {mode === "SELL" && selected && (
                <div>
                  <span>Estimated profit / loss on sale</span>
                  <b className="numeric">PKR {fmt(profit)}</b>
                </div>
              )}
            </div>
            <label className="wide">
              {t.notes}
              <textarea
                value={note}
                maxLength={500}
                onChange={(e) => setNote(e.target.value)}
              />
            </label>
          </div>
          <p className="help-note">
            {mode === "BUY"
              ? "Paid purchase: currency goes directly into stock and this PKR amount is deducted from cash. Customer receivable remains unchanged."
              : paymentMode === "CASH"
                ? "Stock decreases and PKR cash increases. This sale is fully paid."
                : "Stock decreases and this PKR amount is added to the customer khata. Cash increases when payment is received."}
          </p>
          {err && (
            <div className="notice error" role="alert">
              {err}
            </div>
          )}
          <div className="form-footer">
            <button
              className="primary"
              disabled={busy || !currency || (mode === "SELL" && !selected)}
            >
              {busy
                ? "Saving…"
                : mode === "BUY"
                  ? "Save Purchase & Payment"
                  : "Save Sale"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
function Stock({ c }: { c: Context }) {
  const t = c.t,
    [modal, setModal] = useState(""),
    [page, setPage] = useState(1),
    [code, setCode] = useState(""),
    [reverse, setReverse] = useState<Row | null>(null),
    [key, setKey] = useState(() => crypto.randomUUID());
  const { data, error } = useData("/stock", c.version),
    { data: history, error: histError } = useData(
      `/stock/history?page=${page}${code ? "&currencyCode=" + code : ""}`,
      c.version,
    );
  return (
    <>
      <div className="khata-heading">
        <h1>{t.stock}</h1>
        {c.can("transaction.create") && (
          <button
            className="primary"
            onClick={() => {
              setKey(crypto.randomUUID());
              setModal("stock");
            }}
          >
            <Plus size={18} />
            {t.addStock}
          </button>
        )}
      </div>
      <p className="help-note">{t.stockHelp}</p>
      {!data ? <Load error={error} /> : <StockCards rows={data} t={t} />}
      <div className="quick-actions">
        {c.can("report.read") && (
          <a className="button" href="/api/stock/export">
            <Download size={16} />
            Excel
          </a>
        )}
        {c.can("settings.write") && (
          <button onClick={() => setModal("currency")}>+ {t.currency}</button>
        )}
      </div>
      <Section title={t.history} />
      <select
        aria-label={t.currency}
        value={code}
        onChange={(e) => {
          setCode(e.target.value);
          setPage(1);
        }}
      >
        <option value="">All currencies</option>
        {c.boot.currencies?.map((x: Row) => (
          <option key={x.code} value={x.code}>
            {x.code}
          </option>
        ))}
      </select>
      {!history ? (
        <Load error={histError} />
      ) : (
        <>
          <div className="ledger-list">
            {history.rows.length ? (
              history.rows.map((e: Row) => (
                <article className="ledger-card" key={e.id}>
                  <div className="ledger-body">
                    <strong>
                      {e.currencyCode} ·{" "}
                      {e.kind === "STOCK_ADD"
                        ? t.addStock
                        : e.kind === "REVERSAL"
                          ? t.reversal
                          : e.kind === "FX_PURCHASED"
                            ? "Currency Purchased"
                            : t.given}{" "}
                      {e.reversed && (
                        <span className="reversed-tag">{t.reversed}</span>
                      )}
                    </strong>
                    <small>{when(e.createdAt)}</small>
                    <p className="numeric">
                      {fmt(e.quantityDelta, 4)} @ PKR {fmt(e.rate, 8)}
                    </p>
                    <small>
                      {t.stockRemaining}:{" "}
                      <span className="numeric">{fmt(e.quantityAfter, 4)}</span>
                    </small>
                    {e.note && <p>{e.note}</p>}
                    {c.can("settings.write") &&
                      e.kind === "STOCK_ADD" &&
                      !e.reversed && (
                        <div className="record-actions">
                          <button
                            onClick={() => {
                              setKey(crypto.randomUUID());
                              setReverse(e);
                            }}
                          >
                            {t.reverse}
                          </button>
                        </div>
                      )}
                  </div>
                </article>
              ))
            ) : (
              <Empty t={t} />
            )}
          </div>
          <Pager data={history} page={page} set={setPage} />
        </>
      )}
      {modal === "stock" && (
        <Modal title={t.addStock} onClose={() => setModal("")}>
          <Form
            fields={[
              {
                key: "currencyCode",
                label: t.currency,
                type: "select",
                options: c.boot.currencies.map((p: Row) => ({
                  value: p.code,
                  label: p.code + " — " + p.name,
                })),
              },
              { key: "quantity", label: t.quantity, type: "number" },
              { key: "rate", label: t.rate, type: "number" },
              noteField(t),
            ]}
            label={t.save}
            onSave={async (v) => {
              await request("/stock", "POST", v, key);
              setModal("");
              c.refresh();
              c.notify(t.addStock);
            }}
          />
        </Modal>
      )}
      {modal === "currency" && (
        <Modal title={t.currency} onClose={() => setModal("")}>
          <Form
            fields={[
              {
                key: "code",
                label: "Currency code (3 uppercase letters)",
                wide: true,
              },
              { key: "name", label: "Currency name", wide: true },
            ]}
            onSave={async (v) => {
              await request("/currencies", "POST", v);
              setModal("");
              c.refresh();
            }}
          />
        </Modal>
      )}
      {reverse && (
        <Modal title={t.reverse} onClose={() => setReverse(null)}>
          <p>
            {reverse.currencyCode} · {fmt(reverse.quantityDelta, 4)}
          </p>
          <Form
            fields={[
              { key: "reason", label: t.reason, type: "textarea", wide: true },
            ]}
            label={t.reverse}
            onSave={async (v) => {
              await request(`/stock/${reverse.id}/reverse`, "POST", v, key);
              setReverse(null);
              c.refresh();
              c.notify(t.reversal);
            }}
          />
        </Modal>
      )}
    </>
  );
}
function More({ c }: { c: Context }) {
  const [show, setShow] = useState(false),
    [page, setPage] = useState(1);
  const t = c.t,
    { data, error } = useData(
      c.can("audit.read") ? "/audit?page=" + page : "/settings",
      c.version,
    );
  return (
    <>
      <div className="khata-heading">
        <div>
          <h1>{t.more}</h1>
          <p>{t.manage}</p>
        </div>
      </div>
      <div className="quick-actions">
        {c.can("report.read") && (
          <Link className="button" to="/reports">
            <Download size={18} />
            Reports · Profit &amp; Loss
          </Link>
        )}
        <Link className="button" to="/cash">
          <Wallet size={18} />
          PKR Cash Ledger
        </Link>
      </div>
      <div className="settings-card">
        <h2>{c.boot.settings.legalName}</h2>
        <p>{c.boot.settings.address}</p>
        <p>{c.boot.settings.phone}</p>
        {c.can("settings.write") && (
          <button className="primary" onClick={() => setShow(true)}>
            {t.settings}
          </button>
        )}
      </div>
      {c.can("audit.read") && (
        <>
          <Section title={t.audit} />
          {!data ? (
            <Load error={error} />
          ) : (
            <>
              <div className="ledger-list">
                {data.rows.map((e: Row) => (
                  <div className="ledger-card" key={e.id}>
                    <div className="ledger-body">
                      <strong>{e.action.replaceAll("_", " ")}</strong>
                      <small>{when(e.createdAt)}</small>
                      <small>
                        {e.entityType} · {e.entityId}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
              <Pager data={data} page={page} set={setPage} />
            </>
          )}
        </>
      )}
      {show && (
        <Modal title={t.settings} onClose={() => setShow(false)}>
          <Form
            initial={c.boot.settings}
            fields={[
              { key: "legalName", label: "Business name", wide: true },
              { key: "address", label: "Address", required: false, wide: true },
              { key: "phone", label: t.phone, required: false, wide: true },
              {
                key: "receiptFooter",
                label: "Receipt footer",
                required: false,
                wide: true,
              },
            ]}
            label={t.save}
            onSave={async (v) => {
              await request("/settings", "PATCH", v);
              setShow(false);
              c.refresh();
              c.notify(t.save);
            }}
          />
        </Modal>
      )}
    </>
  );
}
createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);

function Cash({ c }: { c: Context }) {
  const [page, setPage] = useState(1),
    [modal, setModal] = useState(false),
    [reverse, setReverse] = useState<Row | null>(null),
    [key, setKey] = useState(() => crypto.randomUUID());
  const [from, setFrom] = useState(""),
    [to, setTo] = useState("");
  const params = new URLSearchParams({
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
  });
  const { data, error } = useData(
    "/cash?" + params + "&page=" + page,
    c.version,
  );
  return (
    <>
      <div className="khata-heading">
        <div>
          <h1>PKR Cash Ledger</h1>
          <p>Opening cash, purchases, paid sales, payments and expenses.</p>
        </div>
        {c.can("settings.write") && (
          <button
            className="primary"
            onClick={() => {
              setKey(crypto.randomUUID());
              setModal(true);
            }}
          >
            Add Cash / Expense
          </button>
        )}
      </div>
      <div className="report-filters">
        <label>
          From
          <input
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(1);
            }}
          />
        </label>
        <label>
          To
          <input
            type="date"
            value={to}
            min={from || undefined}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(1);
            }}
          />
        </label>
        {c.can("report.read") && (
          <div className="report-exports">
            <a
              className="button"
              target="_blank"
              rel="noopener"
              href={"/api/cash/export?" + params}
            >
              PDF
            </a>
            <a
              className="button"
              href={"/api/cash/export?" + params + "&format=xlsx"}
            >
              Excel
            </a>
          </div>
        )}
      </div>
      {!data ? (
        <Load error={error} />
      ) : (
        <>
          <div className="report-metrics">
            {[
              ["Opening Balance", data.summary.opening],
              ["Cash In", data.summary.cashIn],
              ["Cash Out", data.summary.cashOut],
            ].map(([label, value]) => (
              <div className="stat-card" key={label}>
                <small>{label} · PKR</small>
                <strong className="numeric">{fmt(value)}</strong>
              </div>
            ))}
          </div>
          <div className="party-balance">
            <small>Closing Cash Balance · Selected Period</small>
            <strong className="numeric">PKR {fmt(data.balance)}</strong>
            {new Decimal(data.balance).lt(0) && (
              <span>
                Cash is negative. Record your actual opening cash or reconcile
                missing cash entries.
              </span>
            )}
          </div>
          <div className="ledger-list">
            {data.rows.map((e: Row) => (
              <article className="ledger-card" key={e.id}>
                <div className="ledger-body">
                  <strong>{e.kind.replaceAll("_", " ")}</strong>
                  <small>
                    {when(e.createdAt)} · {e.reference}
                  </small>
                  <p>{e.note}</p>
                  <small className="numeric">
                    Balance: PKR {fmt(e.balanceAfter)}
                  </small>
                  {e.reversed && <small>Reversed</small>}
                  {c.can("settings.write") &&
                    ["ADJUSTMENT", "EXPENSE"].includes(e.kind) &&
                    !e.reversed && (
                      <div className="record-actions">
                        <button
                          onClick={() => {
                            setKey(crypto.randomUUID());
                            setReverse(e);
                          }}
                        >
                          Reverse Entry
                        </button>
                      </div>
                    )}
                </div>
                <strong className="numeric">
                  {new Decimal(e.amountDelta).gt(0) ? "+" : ""}
                  {fmt(e.amountDelta)} PKR
                </strong>
              </article>
            ))}
          </div>
          <Pager data={data} page={page} set={setPage} />
        </>
      )}
      {modal && (
        <Modal title="Record Cash Movement" onClose={() => setModal(false)}>
          <Form
            fields={[
              {
                key: "kind",
                label: "Entry Type",
                type: "select",
                value: "ADJUSTMENT",
                options: [
                  { value: "ADJUSTMENT", label: "Opening Cash / Adjustment" },
                  { value: "EXPENSE", label: "Business Expense" },
                ],
              },
              {
                key: "direction",
                label: "Direction",
                type: "select",
                value: "IN",
                options: [
                  { value: "IN", label: "Cash In" },
                  { value: "OUT", label: "Cash Out" },
                ],
              },
              {
                key: "amount",
                label: "PKR Amount",
                type: "number",
                wide: true,
              },
              {
                key: "reason",
                label: "Reason / Expense Description",
                type: "textarea",
                wide: true,
              },
            ]}
            onSave={async (v) => {
              await request("/cash", "POST", v, key);
              setModal(false);
              c.refresh();
              c.notify("Cash entry saved");
            }}
          />
        </Modal>
      )}
      {reverse && (
        <Modal title="Reverse Cash Entry" onClose={() => setReverse(null)}>
          <p>
            {reverse.kind} · PKR {fmt(reverse.amountDelta)}
          </p>
          <Form
            fields={[
              { key: "reason", label: "Reason", type: "textarea", wide: true },
            ]}
            label="Reverse Entry"
            onSave={async (v) => {
              await request(`/cash/${reverse.id}/reverse`, "POST", v, key);
              setReverse(null);
              c.refresh();
              c.notify("Cash correction saved");
            }}
          />
        </Modal>
      )}
    </>
  );
}

if (import.meta.env.PROD && "serviceWorker" in navigator) { navigator.serviceWorker.register("/sw.js").catch(() => {}); }
