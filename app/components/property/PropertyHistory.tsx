"use client";
import { useConfirmation } from "@/app/lib/useConfirmation";
import { useState } from "react";
import { managementRequest } from "@/app/lib/managementClient";
type Entry = {
  id: string;
  before: Record<string, unknown>;
  version: number;
  action: string;
  actorEmail: string;
  createdAt: string;
};
const labels: Record<string, string> = {
  title: "Név",
  city: "Város",
  district: "Városrész",
  price: "Ár (Ft)",
  area: "Alapterület (m²)",
  rooms: "Szobaszám",
  phone: "Telefon",
  email: "E-mail",
  description: "Leírás",
  status: "Státusz",
  propertyType: "Ingatlantípus",
  listingPurpose: "Eladó / kiadó",
  condition: "Állapot",
  floor: "Emelet",
  balcony: "Erkély",
  parking: "Parkolás",
  heating: "Fűtés",
  images: "Képek",
  featured: "Kiemelt",
  lat: "Szélesség",
  lng: "Hosszúság",
};
const actions: Record<string, string> = {
  update: "Szerkesztés",
  archive: "Archiválás",
  unarchive: "Visszaállítás az archívumból",
  restore: "Korábbi adatok visszaállítása",
  transfer: "Tulajdonos átadása",
};
export default function PropertyHistory({
  id,
  version,
  isAdmin,
}: {
  id: string;
  version: number;
  isAdmin: boolean;
}) {
  const { confirm: confirmAction, dialog: confirmationDialog } =
    useConfirmation();
  const [entries, setEntries] = useState<Entry[]>([]),
    [opened, setOpened] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function load() {
    setOpened(true);
    setBusy(true);
    setError("");
    try {
      const data = await managementRequest<{ history: Entry[] }>(
        `/api/posts/${id}`,
      );
      setEntries(data.history);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function restore(item: Entry) {
    if (
      !(await confirmAction(
        `Visszaállítod a(z) ${item.version}. módosítás ELŐTTI adatokat? A mostani állapot is megmarad az előzményekben. A még nem mentett szerkesztések elvesznek.`,
      ))
    )
      return;
    setBusy(true);
    setError("");
    try {
      await managementRequest(
        `/api/posts/${id}`,
        { action: "restore", expectedVersion: version, historyId: item.id },
        "PATCH",
      );
      window.location.reload();
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="mb-7 rounded-2xl border border-[#d8d2c7] bg-[#f7f4ee] p-4">
      {confirmationDialog}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-bold">Módosítási előzmények</h2>
        <button
          type="button"
          disabled={busy}
          onClick={() => void load()}
          className="rounded-xl border bg-white px-4 py-2 disabled:opacity-50"
        >
          {busy ? "Betöltés…" : opened ? "Frissítés" : "Előzmények megnyitása"}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-red-700">
          {error}
        </p>
      )}
      {opened && (
        <>
          <p className="mt-3 text-sm text-[#6c776f]">
            Az utolsó 100 módosítás előtti állapot. A korábbi, naplózás nélküli
            módosítások nem állíthatók vissza innen.
          </p>
          {!busy && !entries.length && (
            <p className="mt-3">Még nincs mentett előzmény.</p>
          )}
          <div className="mt-3 max-h-[500px] space-y-3 overflow-auto">
            {entries.map((item) => (
              <details key={item.id} className="rounded-xl border bg-white p-3">
                <summary className="cursor-pointer font-semibold">
                  {item.version}. {actions[item.action] || item.action} ·{" "}
                  {new Date(item.createdAt).toLocaleString("hu-HU")} ·{" "}
                  {item.actorEmail || "Admin"}
                </summary>
                <dl className="my-3 space-y-2 text-sm">
                  {Object.entries(labels).map(([key, label]) => (
                    <div key={key}>
                      <dt className="font-bold">{label}</dt>
                      <dd className="whitespace-pre-wrap break-words">
                        {Array.isArray(item.before[key])
                          ? `${(item.before[key] as unknown[]).length} kép`
                          : typeof item.before[key] === "boolean"
                            ? item.before[key]
                              ? "Igen"
                              : "Nem"
                            : String(item.before[key] ?? "Nincs adat")}
                      </dd>
                    </div>
                  ))}
                </dl>
                {isAdmin && (
                  <button
                    type="button"
                    className="rounded-xl bg-[#176b3a] px-4 py-2 font-bold text-white disabled:opacity-50"
                    disabled={busy}
                    onClick={() => void restore(item)}
                  >
                    Ennek az állapotnak a visszaállítása
                  </button>
                )}
              </details>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
