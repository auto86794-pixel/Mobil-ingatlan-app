"use client";
import { useConfirmation } from "@/app/lib/useConfirmation";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { managementRequest } from "@/app/lib/managementClient";
type Account = {
  id: string;
  email: string;
  role: "admin" | "user";
  disabled: boolean;
  verified: boolean;
  deleting: boolean;
  hasAuth?: boolean;
};
type Preview = {
  email: string;
  posts: { id: string; title: string; status: string }[];
  operation: { recipient?: string; state?: string } | null;
};
const button =
  "rounded-xl border border-[#d8d2c7] px-3 py-2 text-sm font-semibold disabled:opacity-40";
export default function UserManagement({ actorUid }: { actorUid: string }) {
  const { confirm: confirmAction, dialog: confirmationDialog } =
    useConfirmation();
  const [users, setUsers] = useState<Account[]>([]),
    [cursor, setCursor] = useState<string | null>(null);
  const [search, setSearch] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [selected, setSelected] = useState<Account | null>(null),
    [preview, setPreview] = useState<Preview | null>(null);
  const [confirmation, setConfirmation] = useState(""),
    [recipient, setRecipient] = useState(actorUid);
  const load = useCallback(async (append = false, pageCursor?: string) => {
    setBusy(true);
    setError("");
    try {
      const data = await managementRequest<{
        users: Account[];
        cursor: string | null;
      }>(
        `/api/admin/users${append && pageCursor ? `?cursor=${encodeURIComponent(pageCursor)}` : ""}`,
      );
      setUsers((old) => (append ? [...old, ...data.users] : data.users));
      setCursor(data.cursor);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  async function act(user: Account, action: string, role?: string) {
    if (
      !(await confirmAction(
        action === "role"
          ? `Módosítod ${user.email} jogosultságát?`
          : `${action === "disable" ? "Letiltod" : "Aktiválod"} ezt a fiókot: ${user.email}?`,
      ))
    )
      return;
    setBusy(true);
    try {
      await managementRequest(`/api/admin/users/${user.id}`, { action, role });
      toast.success("Fiók módosítva.");
      await load();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function inspect(user: Account) {
    setBusy(true);
    setPreview(null);
    setSelected(user);
    setConfirmation("");
    setError("");
    try {
      const data = await managementRequest<Preview>(
        `/api/admin/users/${user.id}`,
      );
      setPreview(data);
      setRecipient(data.operation?.recipient || actorUid);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!selected || !preview || busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await managementRequest<{ pending: boolean }>(
        `/api/admin/users/${selected.id}`,
        { action: "delete", recipient, confirmation },
      );
      if (result.pending) {
        toast.success(
          "Az átadás elkezdődött. Folytasd a törlést a következő csoporttal.",
        );
        await inspect(selected);
      } else {
        toast.success("Fiók törölve. Az ingatlanok megmaradtak az átvevőnél.");
        setSelected(null);
        setPreview(null);
        await load();
      }
    } catch (error) {
      setError(
        `${(error as Error).message} A megkezdett művelet innen folytatható.`,
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="mt-10 rounded-3xl border border-[#e2ddd3] bg-white p-5 sm:p-7">
      {confirmationDialog}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-black">Felhasználók kezelése</h2>
        <button className={button} disabled={busy} onClick={() => void load()}>
          Frissítés
        </button>
      </div>
      <p className="mt-2 text-sm text-[#6c776f]">
        A bejelentkezési fiókok és a régi profilok. A letiltás visszavonható. A
        végleges törlés megtartja és átadja az ingatlanokat.
      </p>
      <input
        aria-label="Felhasználó keresése"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="E-mail keresése…"
        className="my-4 w-full rounded-xl border p-3"
      />
      {error && (
        <p role="alert" className="my-3 rounded-xl bg-red-50 p-3 text-red-700">
          {error}
        </p>
      )}
      {busy && <p role="status">Betöltés / művelet folyamatban…</p>}
      <div className="divide-y">
        {users
          .filter((user) =>
            user.email.toLowerCase().includes(search.toLowerCase()),
          )
          .map((user) => (
            <div
              key={user.id}
              className="flex flex-wrap items-center justify-between gap-3 py-4"
            >
              <div className="min-w-0">
                <p className="break-all font-bold">
                  {user.email} {user.id === actorUid && "(te)"}
                </p>
                <p className="text-sm text-[#6c776f]">
                  {user.role === "admin" ? "Admin" : "Felhasználó"} ·{" "}
                  {user.hasAuth === false
                    ? "Régi profil, nincs belépési fiók"
                    : user.deleting
                      ? "Törlés folyamatban"
                      : user.disabled
                        ? "Letiltva"
                        : user.verified
                          ? "Aktív, megerősítve"
                          : "E-mail nincs megerősítve"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  aria-label={`${user.email} jogosultsága`}
                  className={button}
                  value={user.role}
                  disabled={
                    busy ||
                    user.id === actorUid ||
                    user.deleting ||
                    user.disabled ||
                    !user.verified ||
                    user.hasAuth === false
                  }
                  onChange={(e) => void act(user, "role", e.target.value)}
                >
                  <option value="user">Felhasználó</option>
                  <option value="admin">Admin</option>
                </select>
                {user.role !== "admin" && user.id !== actorUid && (
                  <>
                    <button
                      disabled={busy || user.deleting || user.hasAuth === false}
                      className={button}
                      onClick={() =>
                        void act(user, user.disabled ? "enable" : "disable")
                      }
                    >
                      {user.disabled ? "Aktiválás" : "Letiltás"}
                    </button>
                    <button
                      disabled={busy}
                      className={`${button} text-red-700`}
                      onClick={() => void inspect(user)}
                    >
                      {user.deleting ? "Törlés folytatása" : "Törlés előnézete"}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
      </div>
      {!busy && !users.length && !error && <p>Nincs felhasználó.</p>}
      {cursor && (
        <button
          disabled={busy}
          className={button}
          onClick={() => void load(true, cursor || undefined)}
        >
          További felhasználók
        </button>
      )}
      {selected && preview && (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5">
          <h3 className="text-lg font-bold">
            Végleges fióktörlés: {preview.email}
          </h3>
          <p className="mt-2">
            {preview.posts.length} ingatlan megmarad, és az alább választott
            adminhoz kerül. A belépési fiók törlése nem visszavonható.
          </p>
          <ul className="my-3 max-h-48 overflow-auto">
            {preview.posts.map((post) => (
              <li key={post.id}>
                {post.title} · {post.status}
              </li>
            ))}
          </ul>
          <label className="block">
            Átvevő admin
            <select
              className="mt-1 block w-full rounded-xl border bg-white p-3"
              value={recipient}
              disabled={busy || Boolean(preview.operation?.recipient)}
              onChange={(e) => setRecipient(e.target.value)}
            >
              {users
                .filter(
                  (user) =>
                    user.role === "admin" && user.verified && !user.disabled,
                )
                .map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.email}
                  </option>
                ))}
            </select>
          </label>
          <label className="mt-3 block">
            Megerősítés: írd be pontosan a fenti e-mail-címet
            <input
              className="mt-1 block w-full rounded-xl border bg-white p-3"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              autoComplete="off"
            />
          </label>
          <div className="mt-4 flex gap-2">
            <button
              className={`${button} bg-red-700 text-white`}
              disabled={busy || confirmation !== preview.email || !recipient}
              onClick={() => void remove()}
            >
              {preview.operation
                ? "Törlés folytatása"
                : "Ingatlanok átadása és fiók törlése"}
            </button>
            <button
              className={button}
              disabled={busy}
              onClick={() => {
                setSelected(null);
                setPreview(null);
              }}
            >
              Bezárás
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
