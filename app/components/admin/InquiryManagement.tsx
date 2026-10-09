"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { managementRequest } from "@/app/lib/managementClient";
type Inquiry = {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  propertyId: string;
  propertyTitle: string;
  createdAt: string;
  status: string;
  notes: string;
  viewingAt: string;
  version: number;
  delivery: string;
};
const statuses = {
  new: "Új",
  callback: "Visszahívás",
  viewing: "Megtekintés",
  closed: "Lezárt",
};
const input = "rounded-xl border border-[#d8d2c7] bg-white p-3";
export default function InquiryManagement() {
  const [items, setItems] = useState<Inquiry[]>([]),
    [cursor, setCursor] = useState<string | null>(null),
    [legacyCursor, setLegacyCursor] = useState<string | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false),
    [filter, setFilter] = useState("all");
  const load = useCallback(async (append = false, pageCursor?: string) => {
    setLoading(true);
    setError("");
    try {
      type Page = {inquiries:Inquiry[];cursor:string|null};
      const [data, legacy] = await Promise.all([
        append && !pageCursor ? Promise.resolve({inquiries:[],cursor:null} as Page) : managementRequest<Page>(`/api/admin/inquiries${append ? `?cursor=${encodeURIComponent(pageCursor!)}` : ""}`),
        append && !legacyCursor ? Promise.resolve({inquiries:[],cursor:null} as Page) : managementRequest<Page>(`/api/admin/inquiries?source=legacy${append ? `&cursor=${encodeURIComponent(legacyCursor!)}` : ""}`),
      ]);
      setItems(old => Array.from(new Map([...(append ? old : []),...data.inquiries,...legacy.inquiries].map(item=>[item.id,item])).values()).sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime()));
      setCursor(data.cursor);
      setLegacyCursor(legacy.cursor);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [legacyCursor]);
  useEffect(() => {
    void load();
    // Initial load only; pagination explicitly calls load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <section className="mt-10 rounded-3xl border border-[#e2ddd3] bg-white p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-black">Érdeklődések</h2>
        <button
          disabled={loading}
          className={input}
          onClick={() => void load()}
        >
          Frissítés
        </button>
      </div>
      <p className="my-3 text-sm text-[#6c776f]">
        Az új érdeklődések itt is megmaradnak. A korábban elküldött e-mailek nem
        kerülnek visszamenőleg a listába.
      </p>
      <select
        aria-label="Érdeklődési státusz szűrése"
        className={input}
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      >
        <option value="all">Minden státusz</option>
        {Object.entries(statuses).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
      {error && (
        <p role="alert" className="my-3 text-red-700">
          {error}
        </p>
      )}
      {loading && <p role="status">Betöltés…</p>}
      <div className="mt-4 space-y-4">
        {items
          .filter((item) => filter === "all" || item.status === filter)
          .map((item) => (
            <InquiryCard
              key={`${item.id}-${item.version}`}
              item={item}
              onSaved={() => void load()}
            />
          ))}
      </div>
      {!loading &&
        !items.some((item) => filter === "all" || item.status === filter) && (
          <p className="my-4">Nincs megjeleníthető érdeklődés.</p>
        )}
      {(cursor || legacyCursor) && (
        <button
          className={input}
          disabled={loading}
          onClick={() => void load(true, cursor || undefined)}
        >
          További érdeklődések
        </button>
      )}
    </section>
  );
}
function InquiryCard({
  item,
  onSaved,
}: {
  item: Inquiry;
  onSaved: () => void;
}) {
  const [status, setStatus] = useState(item.status),
    [notes, setNotes] = useState(item.notes),
    [date, setDate] = useState(
      item.viewingAt
        ? new Date(
            new Date(item.viewingAt).getTime() -
              new Date(item.viewingAt).getTimezoneOffset() * 60000,
          )
            .toISOString()
            .slice(0, 16)
        : "",
    ),
    [busy, setBusy] = useState(false);
  async function save() {
    setBusy(true);
    try {
      await managementRequest(
        "/api/admin/inquiries",
        {
          id: item.id,
          expectedVersion: item.version,
          status,
          notes,
          viewingAt: date ? new Date(date).toISOString() : "",
        },
        "PATCH",
      );
      toast.success("Érdeklődés mentve.");
      onSaved();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <article className="break-words rounded-2xl border p-4">
      <div className="flex flex-wrap justify-between gap-2">
        <h3 className="break-words font-bold">{item.name}</h3>
        <time className="text-sm text-[#6c776f]">
          {new Date(item.createdAt).toLocaleString("hu-HU")}
        </time>
      </div>
      <div className="my-2 flex flex-wrap gap-4">
        <a className="break-all text-[#176b3a] underline" href={`mailto:${item.email}`}>
          {item.email}
        </a>
        {item.phone && (
          <a className="text-[#176b3a] underline" href={`tel:${item.phone}`}>
            {item.phone}
          </a>
        )}
        {item.propertyId && (
          <Link className="underline" href={`/post/${item.propertyId}`}>
            {item.propertyTitle || "Ingatlan"}
          </Link>
        )}
      </div>
      <p className="whitespace-pre-wrap break-words">{item.message}</p>
      {item.delivery !== "sent" && item.delivery !== "legacy" && (
        <p className="mt-2 text-sm text-amber-800">
          {item.delivery === "pending"
            ? "E-mail-értesítés még nincs visszaigazolva."
            : "E-mail-értesítés nem sikerült. Az érdeklődés itt megmaradt."}
        </p>
      )}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label>
          Státusz
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={`${input} mt-1 w-full`}
          >
            {Object.entries(statuses).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Megtekintési időpont
          <input
            type="datetime-local"
            className={`${input} mt-1 w-full`}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
      </div>
      <label className="mt-3 block">
        Belső megjegyzés
        <textarea
          className={`${input} mt-1 w-full`}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={5000}
        />
      </label>
      <button
        className="mt-3 rounded-xl bg-[#008000] px-4 py-3 font-bold text-white disabled:opacity-50"
        disabled={busy}
        onClick={() => void save()}
      >
        {busy ? "Mentés…" : "Mentés"}
      </button>
    </article>
  );
}
