import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  FileText,
  Download,
  TrendingUp,
  Package,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";
import { fmt, when } from "./api";
import { Load, useData, type Row } from "./shared";
import type { Context } from "./main";
const choices = [
  { value: "PNL", label: "Profit & Loss", icon: TrendingUp },
  { value: "POSITION", label: "Currency Inventory", icon: Package },
  { value: "PURCHASE", label: "Purchases", icon: ArrowDownLeft },
  { value: "SALE", label: "Sales", icon: ArrowUpRight },
];
export function Reports({ c }: { c: Context }) {
  const [search, setSearch] = useSearchParams(),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [currency, setCurrency] = useState(""),
    [page, setPage] = useState(1);
  const type = choices.some((x) => x.value === search.get("type"))
      ? search.get("type")!
      : "PNL",
    inventory = type === "POSITION";
  const params = new URLSearchParams({
    type,
    ...(!inventory && from ? { from } : {}),
    ...(!inventory && to ? { to } : {}),
    ...(currency ? { currencyCode: currency } : {}),
  });
  const { data: response, error } = useData(
    "/reports?" + params + "&page=" + page,
    c.version,
  );
  const data = response?.type === type ? response : null;
  const selected = choices.find((x) => x.value === type)!;
  const reset = (fn: () => void) => {
    fn();
    setPage(1);
  };
  return (
    <section className="reports-workspace">
      <div className="khata-heading">
        <div>
          <h1>Reports</h1>
          <p>A separate report for each part of your business.</p>
        </div>
      </div>
      <nav className="report-tabs" aria-label="Report category">
        {choices.map((x) => (
          <button
            key={x.value}
            aria-pressed={type === x.value}
            className={type === x.value ? "selected" : ""}
            onClick={() => reset(() => setSearch({ type: x.value }))}
          >
            <x.icon size={18} />
            {x.label}
          </button>
        ))}
      </nav>
      <div className="report-panel">
        <div className="report-panel-header">
          <div>
            <h2>{selected.label}</h2>
            <p>
              {inventory
                ? "Current currency quantities and weighted-average stock cost."
                : type === "PNL"
                  ? "Sales income, cost of sales, expenses and net profit."
                  : type === "PURCHASE"
                    ? "Customer currency purchases and their corrections."
                    : "Currency sales and their corrections."}
            </p>
          </div>
          <div className="report-exports">
            <a
              className="button"
              target="_blank"
              rel="noopener"
              href={"/api/reports/export?" + params}
            >
              <FileText size={16} />
              PDF
            </a>
            <a
              className="button"
              href={"/api/reports/export?" + params + "&format=xlsx"}
            >
              <Download size={16} />
              Excel
            </a>
          </div>
        </div>
        <div className="report-filters">
          {!inventory && (
            <>
              <label>
                From
                <input
                  type="date"
                  value={from}
                  onChange={(e) => reset(() => setFrom(e.target.value))}
                />
              </label>
              <label>
                To
                <input
                  type="date"
                  value={to}
                  min={from || undefined}
                  onChange={(e) => reset(() => setTo(e.target.value))}
                />
              </label>
            </>
          )}
          <label>
            Currency
            <select
              value={currency}
              onChange={(e) => reset(() => setCurrency(e.target.value))}
            >
              <option value="">All currencies</option>
              {c.boot.currencies.map((p: Row) => (
                <option key={p.code}>{p.code}</option>
              ))}
            </select>
          </label>
          <button
            className="button filter-reset"
            onClick={() =>
              reset(() => {
                setFrom("");
                setTo("");
                setCurrency("");
              })
            }
          >
            Reset filters
          </button>
        </div>
        {!data ? (
          <Load error={error} />
        ) : type === "PNL" ? (
          <>
            <div className="report-metrics">
              {[
                ["Sales Revenue", data.summary.sales],
                ["Cost of Sales", data.summary.costOfSales],
                ["Gross Profit / Loss", data.summary.tradingProfit],
                ["Operating Expenses", data.summary.expenses],
                ["Net Profit / Loss", data.summary.netProfit],
              ].map(([label, value]) => (
                <div className="stat-card" key={label}>
                  <small>{label} · PKR</small>
                  <strong
                    className={
                      "numeric " +
                      (label === "Net Profit / Loss" ? "report-net" : "")
                    }
                  >
                    {fmt(value)}
                  </strong>
                </div>
              ))}
            </div>
            <div className="income-statement">
              <h3>
                Income Statement <small>PKR</small>
              </h3>
              {[
                ["Sales revenue", data.summary.sales],
                ["Less: cost of sales", data.summary.costOfSales],
                ["Gross trading profit / loss", data.summary.tradingProfit],
                ["Less: operating expenses", data.summary.expenses],
                ["Net profit / loss", data.summary.netProfit],
              ].map(([label, value], i) => (
                <div
                  className={
                    i === 4
                      ? "statement-total"
                      : i === 2
                        ? "statement-subtotal"
                        : ""
                  }
                  key={label}
                >
                  <span>{label}</span>
                  <strong className="numeric">{fmt(value)}</strong>
                </div>
              ))}
            </div>
            <p className="help-note">{data.note}</p>
          </>
        ) : inventory ? (
          <>
            <div className="report-metrics">
              <div className="stat-card">
                <small>Inventory Value · PKR</small>
                <strong className="numeric">
                  {fmt(data.summary.stockValue)}
                </strong>
              </div>
              <div className="stat-card">
                <small>Currencies in Stock</small>
                <strong>{data.summary.currencies}</strong>
              </div>
            </div>
            <p className="help-note">
              Live position as of {when(data.asOf)}. Quantity is shown
              separately for each currency.
            </p>
            {!data.rows.length ? (
              <Empty />
            ) : (
              <div className="stock-grid">
                {data.rows.map((p: Row) => (
                  <article className="currency-card" key={p.id}>
                    <strong>{p.currencyCode}</strong>
                    <strong className="stock-quantity numeric">
                      {fmt(p.quantity, 4)}
                    </strong>
                    <small>Available Quantity</small>
                    <div className="currency-footer">
                      <span>Average Cost · PKR</span>
                      <b className="numeric">{fmt(p.averageRate, 4)}</b>
                    </div>
                    <div className="currency-footer">
                      <span>Stock Value · PKR</span>
                      <b className="numeric">{fmt(p.cost)}</b>
                    </div>
                  </article>
                ))}
              </div>
            )}
            <Pagination data={data} page={page} set={setPage} />
          </>
        ) : (
          <>
            <div className="report-metrics">
              <div className="stat-card">
                <small>
                  {type === "PURCHASE"
                    ? "Net Purchase Value"
                    : "Net Sales Value"}{" "}
                  · PKR
                </small>
                <strong className="numeric">{fmt(data.summary.total)}</strong>
              </div>
              <div className="stat-card">
                <small>{type === "PURCHASE" ? "Purchases" : "Sales"}</small>
                <strong>{data.summary.transactions}</strong>
              </div>
              <div className="stat-card">
                <small>Corrections</small>
                <strong>{data.summary.corrections}</strong>
              </div>
            </div>
            {!data.rows.length ? (
              <Empty />
            ) : (
              <div className="ledger-list">
                {data.rows.map((e: Row) => (
                  <article className="ledger-card" key={e.id}>
                    <div className="ledger-body">
                      <strong>{e.partyName}</strong>
                      <small>
                        {when(e.createdAt)} · {e.reference}
                      </small>
                      <p className="numeric">
                        {fmt(e.foreignAmount, 4)} {e.currencyCode} @{" "}
                        {fmt(e.rate, 4)} PKR
                      </p>
                      <span className="report-status">
                        {e.isCorrection
                          ? "Correction"
                          : e.reversed
                            ? "Reversed"
                            : e.paymentMode === "CASH"
                              ? "Paid"
                              : "Credit"}
                      </span>
                    </div>
                    <strong className="numeric">PKR {fmt(e.amount)}</strong>
                  </article>
                ))}
              </div>
            )}
            <Pagination data={data} page={page} set={setPage} />
          </>
        )}
      </div>
    </section>
  );
}
function Empty() {
  return (
    <div className="report-empty">
      <FileText size={28} />
      <strong>No records found</strong>
      <p>Change the filters or record a transaction to see it here.</p>
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
  return data.total > 20 ? (
    <div className="pager">
      <button disabled={page <= 1} onClick={() => set(page - 1)}>
        Previous
      </button>
      <span>
        {page} / {Math.ceil(data.total / 20)}
      </span>
      <button disabled={page * 20 >= data.total} onClick={() => set(page + 1)}>
        Next
      </button>
    </div>
  ) : null;
}
