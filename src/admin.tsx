import { useEffect, useState } from "react";
import {
  Plus,
  Users,
  ShieldCheck,
  Copy,
  Search,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
import { request, when, fmt } from "./api";
import {
  Form,
  Modal,
  DataView,
  Badge,
  useData,
  Load,
  type Row,
  type Field,
} from "./shared";
export function AdminPanel({ notify }: { notify: (s: string) => void }) {
  const [version, setVersion] = useState(0),
    [company, setCompany] = useState<Row | null>(null),
    [modal, setModal] = useState(""),
    [selected, setSelected] = useState<Row | null>(null),
    [credentials, setCredentials] = useState<Row | null>(null),
    [search, setSearch] = useState(""),
    [page, setPage] = useState(1),
    [tab, setTab] = useState("accounts");
  const { data: companies, error } = useData("/admin/companies", version),
    { data: plans } = useData("/admin/plans", version),
    { data: detail, error: userError } = useData(
      company
        ? `/admin/companies/${company.id}/users?page=${page}&search=${encodeURIComponent(search)}`
        : "/admin/companies",
      version,
    ),
    { data: activity } = useData("/admin/activity?page=" + page, version);
  const refresh = () => setVersion((v) => v + 1);
  const open = (name: string, row: Row | null = null) => {
    setSelected(row);
    setModal(name);
  };
  const url = window.location.origin;
  const filtered = companies?.filter((x: Row) =>
    [x.name, ...x.users.map((u: Row) => u.email)]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const subFields: Field[] = [
    {
      key: "plan",
      label: "Subscription plan",
      type: "select",
      value: "Standard",
      options: (plans || [{ name: "Standard" }]).map((p: Row) => ({
        value: p.name,
        label: p.name,
      })),
    },
    {
      key: "userLimit",
      label: "Active user limit",
      type: "number",
      value: "5",
    },
    {
      key: "startsAt",
      label: "Access starts",
      type: "date",
      value: new Date().toISOString().slice(0, 10),
    },
    {
      key: "expiresAt",
      label: "Access expires",
      type: "date",
      value: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
    },
  ];
  return (
    <div className="admin-workspace">
      <div className="page-heading">
        <div>
          <p className="eyebrow">AHMED SOLUTIONS · CONTROL PANEL</p>
          <h1>{company ? company.name : "Accounts & Access"}</h1>
          <p>
            {company
              ? "Manage the people who can use this business workspace."
              : "Issue accounts, control access and manage subscriptions."}
          </p>
        </div>
        <button
          className="primary"
          onClick={() => open(company ? "user" : "company")}
        >
          <Plus size={18} />
          {company ? "Add User" : "Create Business Account"}
        </button>
      </div>
      <div className="admin-banner">
        <ShieldCheck size={22} />
        <div>
          <strong>Connected to Khata OS</strong>
          <p>
            Users sign in at <span>{url}</span>. Suspended accounts lose access
            immediately.
          </p>
        </div>
      </div>
      {!company && (
        <div className="metric-grid">
          <div className="metric">
            <span>Business accounts</span>
            <h2>{companies?.length || 0}</h2>
          </div>
          <div className="metric">
            <span>Active businesses</span>
            <h2>
              {companies?.filter((c: Row) => c.status === "ACTIVE").length || 0}
            </h2>
          </div>
          <div className="metric">
            <span>Registered users</span>
            <h2>
              {companies?.reduce(
                (n: number, c: Row) => n + c._count.users,
                0,
              ) || 0}
            </h2>
          </div>
        </div>
      )}
      <div className="admin-toolbar">
        {company ? (
          <button
            onClick={() => {
              setCompany(null);
              setSearch("");
              setPage(1);
            }}
          >
            <ArrowLeft size={16} />
            All Accounts
          </button>
        ) : (
          <div className="segmented">
            <button
              className={tab === "accounts" ? "selected" : ""}
              onClick={() => {
                setTab("accounts");
                setPage(1);
              }}
            >
              Accounts
            </button>
            <button
              className={tab === "plans" ? "selected" : ""}
              onClick={() => setTab("plans")}
            >
              Plans
            </button>
            <button
              className={tab === "activity" ? "selected" : ""}
              onClick={() => {
                setTab("activity");
                setPage(1);
              }}
            >
              Activity
            </button>
          </div>
        )}
        {(company || tab === "accounts") && (
          <label className="khata-search">
            <Search size={18} />
            <input
              aria-label="Search accounts"
              placeholder={
                company
                  ? "Search user name or email"
                  : "Search business or owner email"
              }
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </label>
        )}
      </div>
      {company ? (
        <>
          <div className="admin-business-summary">
            <Badge>{detail?.company?.status || company.status}</Badge>
            <span>
              {detail?.activeUsers || 0} /{" "}
              {detail?.company?.subscription?.userLimit ||
                company.subscription.userLimit}{" "}
              active users
            </span>
            <span>
              Expires{" "}
              {detail?.company?.subscription?.expiresAt.slice(0, 10) ||
                company.subscription.expiresAt.slice(0, 10)}
            </span>
            <button
              onClick={() => open("subscription", detail?.company || company)}
            >
              Manage Subscription
            </button>
          </div>
          {!detail?.rows ? (
            <Load error={userError} />
          ) : (
            <>
              <DataView
                rows={detail.rows}
                columns={[
                  { key: "name", label: "User" },
                  { key: "email", label: "Login Email" },
                  {
                    key: "role",
                    label: "Role",
                    render: (u) => u.role?.name || "—",
                  },
                  {
                    key: "active",
                    label: "Access",
                    render: (u) => (
                      <Badge>{u.active ? "ACTIVE" : "BLOCKED"}</Badge>
                    ),
                  },
                  {
                    key: "password",
                    label: "Password",
                    render: (u) =>
                      u.mustChangePassword
                        ? "Change on next login"
                        : "User managed",
                  },
                ]}
                actions={(u) => (
                  <>
                    <button onClick={() => open("userAccess", u)}>
                      {u.active ? "Revoke Access" : "Grant Access"}
                    </button>
                    <button onClick={() => open("reset", u)}>
                      Reset Password
                    </button>
                  </>
                )}
              />
              <Pagination data={detail} page={page} set={setPage} />
            </>
          )}
        </>
      ) : tab === "accounts" ? (
        !companies ? (
          <Load error={error} />
        ) : (
          <DataView
            rows={filtered || []}
            columns={[
              { key: "name", label: "Business" },
              {
                key: "owner",
                label: "Owner Email",
                render: (c) => c.users.map((u: Row) => u.email).join(", "),
              },
              {
                key: "status",
                label: "Access",
                render: (c) => <Badge>{c.status}</Badge>,
              },
              {
                key: "expiry",
                label: "Expires",
                render: (c) => c.subscription?.expiresAt.slice(0, 10),
              },
              {
                key: "plan",
                label: "Plan",
                render: (c) => c.subscription?.plan,
              },
            ]}
            actions={(c) => (
              <>
                <button
                  onClick={() => {
                    setCompany(c);
                    setSearch("");
                    setPage(1);
                  }}
                >
                  <Users size={14} />
                  Users
                </button>
                <button onClick={() => open("subscription", c)}>
                  Subscription
                </button>
                <button onClick={() => open("companyAccess", c)}>
                  {c.status === "ACTIVE" ? "Suspend" : "Reactivate"}
                </button>
              </>
            )}
          />
        )
      ) : tab === "plans" ? (
        <>
          <div className="panel-heading">
            <h2>Plan Templates</h2>
            <button onClick={() => open("plan")}>Add / Update Plan</button>
          </div>
          {!plans ? (
            <Load />
          ) : (
            <DataView
              rows={plans}
              columns={[
                { key: "name", label: "Plan" },
                { key: "userLimit", label: "Active User Limit" },
                {
                  key: "monthlyPrice",
                  label: "Monthly PKR",
                  render: (p) => fmt(p.monthlyPrice),
                },
              ]}
            />
          )}
        </>
      ) : !activity ? (
        <Load />
      ) : (
        <>
          <DataView
            rows={activity.rows}
            columns={[
              {
                key: "createdAt",
                label: "Time",
                render: (a) => when(a.createdAt),
              },
              {
                key: "action",
                label: "Action",
                render: (a) => a.action.replaceAll("_", " "),
              },
              { key: "entityType", label: "Record" },
              { key: "entityId", label: "Reference" },
            ]}
          />
          <Pagination data={activity} page={page} set={setPage} />
        </>
      )}
      {modal && (
        <Modal
          title={
            {
              company: "Create Business Account",
              user: "Add User",
              subscription: "Manage Subscription",
              companyAccess:
                selected?.status === "ACTIVE"
                  ? "Suspend Business Access"
                  : "Reactivate Business Access",
              userAccess: selected?.active
                ? "Revoke User Access"
                : "Grant User Access",
              reset: "Reset Password",
              plan: "Save Plan Template",
            }[modal] || "Manage Account"
          }
          onClose={() => setModal("")}
        >
          {(modal === "reset" ||
            modal === "companyAccess" ||
            modal === "userAccess") && (
            <p className="admin-confirm">
              {selected?.name} {selected?.email && `(${selected.email})`}
              {modal === "reset"
                ? ". A new temporary password will replace the current password and sign out all sessions. Access status remains unchanged."
                : ". This change applies to the linked Khata OS account. Records are retained."}
            </p>
          )}
          <Form
            key={modal + (selected?.id || "")}
            initial={
              modal === "subscription"
                ? {
                    ...selected?.subscription,
                    startsAt: selected?.subscription.startsAt.slice(0, 10),
                    expiresAt: selected?.subscription.expiresAt.slice(0, 10),
                  }
                : {}
            }
            label={
              modal === "reset"
                ? "Generate Temporary Password"
                : modal === "userAccess"
                  ? selected?.active
                    ? "Revoke Access"
                    : "Grant Access"
                  : modal === "companyAccess"
                    ? selected?.status === "ACTIVE"
                      ? "Suspend Access"
                      : "Reactivate Access"
                    : "Save"
            }
            fields={
              modal === "company"
                ? [
                    { key: "name", label: "Business Name", wide: true },
                    { key: "ownerName", label: "Owner Name" },
                    {
                      key: "ownerEmail",
                      label: "Owner Login Email",
                      type: "email",
                    },
                    ...subFields,
                  ]
                : modal === "subscription"
                  ? subFields
                  : modal === "user"
                    ? [
                        { key: "name", label: "User Name", wide: true },
                        {
                          key: "email",
                          label: "Login Email",
                          type: "email",
                          wide: true,
                        },
                        {
                          key: "role",
                          label: "Role",
                          type: "select",
                          value: "Cashier",
                          wide: true,
                          options: [
                            {
                              value: "Owner",
                              label: "Owner — Full Business Access",
                            },
                            {
                              value: "Manager",
                              label: "Manager — Operations & Reports",
                            },
                            {
                              value: "Cashier",
                              label: "Cashier — Stock, Khata & Payments",
                            },
                            {
                              value: "Auditor",
                              label: "Read Only — View & Export",
                            },
                          ],
                        },
                      ]
                    : modal === "companyAccess" || modal === "userAccess"
                      ? [
                          {
                            key: "reason",
                            label: "Reason",
                            type: "textarea",
                            wide: true,
                          },
                        ]
                      : modal === "plan"
                        ? [
                            { key: "name", label: "Plan Name", wide: true },
                            {
                              key: "userLimit",
                              label: "Active User Limit",
                              type: "number",
                            },
                            {
                              key: "monthlyPrice",
                              label: "Monthly Price PKR",
                              type: "number",
                            },
                          ]
                        : []
            }
            onSave={async (v) => {
              let r: Row = {};
              if (modal === "company" || modal === "subscription") {
                const subscription = {
                  plan: v.plan,
                  startsAt: v.startsAt,
                  expiresAt: v.expiresAt,
                  branchLimit: 1,
                  userLimit: Number(v.userLimit),
                };
                r = await request(
                  "/admin/companies" +
                    (modal === "subscription" ? "/" + selected!.id : ""),
                  modal === "subscription" ? "PATCH" : "POST",
                  modal === "company"
                    ? {
                        name: v.name,
                        ownerName: v.ownerName,
                        ownerEmail: v.ownerEmail,
                        subscription,
                      }
                    : { status: selected!.status, subscription },
                );
              } else if (modal === "user")
                r = await request(
                  `/admin/companies/${company!.id}/users`,
                  "POST",
                  v,
                );
              else if (modal === "userAccess")
                r = await request(
                  `/admin/companies/${company!.id}/users/${selected!.id}/access`,
                  "PATCH",
                  { active: !selected!.active, reason: v.reason },
                );
              else if (modal === "companyAccess")
                r = await request(
                  `/admin/companies/${selected!.id}/access`,
                  "PATCH",
                  {
                    status:
                      selected!.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE",
                    reason: v.reason,
                  },
                );
              else if (modal === "reset") {
                r = await request(
                  `/admin/users/${selected!.id}/reset`,
                  "POST",
                  {},
                );
                r.credentials = {
                  email: selected!.email,
                  temporaryPassword: r.temporaryPassword,
                };
              } else if (modal === "plan")
                r = await request("/admin/plans", "POST", {
                  ...v,
                  userLimit: Number(v.userLimit),
                  branchLimit: 1,
                });
              if (r.credentials) setCredentials(r.credentials);
              setModal("");
              refresh();
              notify("Access settings saved");
            }}
          />
        </Modal>
      )}
      {credentials && (
        <Modal
          title="Account Ready — Save Credentials"
          onClose={() => setCredentials(null)}
        >
          <p>
            The password is shown once. The user must choose a new password on
            first login.
          </p>
          <pre className="credential">
            Login: {url}
            {"\n"}Email: {credentials.email}
            {"\n"}Temporary password: {credentials.temporaryPassword}
          </pre>
          <div className="quick-actions">
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(
                    `Login: ${url}\nEmail: ${credentials.email}\nTemporary password: ${credentials.temporaryPassword}`,
                  );
                  notify("Credentials copied");
                } catch {
                  notify("Select and copy the credential text manually.");
                }
              }}
            >
              <Copy size={16} />
              Copy Details
            </button>
            <a href="/" target="_blank" rel="noopener" className="button">
              <ExternalLink size={16} />
              Open Login
            </a>
          </div>
          <p className="help-note">
            Share these details securely with the intended user. A suspended
            business or expired subscription still blocks login.
          </p>
        </Modal>
      )}
    </div>
  );
}
function Pagination({
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
      <button disabled={page === 1} onClick={() => set(page - 1)}>
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
