"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

type ContactModalProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  propertyTitle?: string;
  propertyId?: string;
  modalTitle?: string;
  initialMessage?: string;
  submitLabel?: string;
  successMessage?: string;
};

const emptyForm = { name: "", phone: "", email: "", message: "", website: "" };

export default function ContactModal({
  open,
  setOpen,
  propertyTitle,
  propertyId,
  modalTitle = "Érdeklődöm",
  initialMessage,
  submitLabel = "Érdeklődés elküldése",
  successMessage = "Megkaptuk az üzeneted. Hamarosan felvesszük veled a kapcsolatot.",
}: ContactModalProps) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorText, setErrorText] = useState("");
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      setStatus("idle");
      setErrorText("");
      setForm((current) => ({
        ...current,
        message: initialMessage ?? (propertyTitle ? `Érdeklődöm a(z) „${propertyTitle}” ingatlan iránt.` : ""),
      }));
    }
  }, [open, propertyTitle, initialMessage]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, setOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((current) => ({ ...current, [e.target.name]: e.target.value }));
  };

  const sendEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setStatus("idle");
    setErrorText("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          email: form.email,
          message: form.message,
          propertyTitle,
          propertyId,
          propertyUrl: propertyId ? `${window.location.origin}/post/${propertyId}` : "",
          website: form.website,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Hiba történt az üzenet küldésekor.");

      setForm(emptyForm);
      setStatus("success");
    } catch (error) {
      console.error(error);
      setErrorText(error instanceof Error ? error.message : "Hiba történt az üzenet küldésekor.");
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-black/30 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="relative mt-20 w-full max-w-md rounded-[28px] border border-[#e2ddd3] bg-white p-7 shadow-[0_24px_70px_rgba(55,47,33,.10)]" onClick={(e) => e.stopPropagation()}>
        <button ref={closeButtonRef} type="button" onClick={() => setOpen(false)} className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full text-gray-500 transition hover:bg-[#f7f4ee] hover:text-[#172019]" aria-label="Bezárás">✕</button>

        {status === "success" ? (
          <div className="py-8 text-center" role="status" aria-live="polite">
            <CheckCircle2 className="mx-auto h-14 w-14 text-[#176b3a]" />
            <h2 id={titleId} className="mt-4 text-2xl font-black text-[#172019]">Köszönjük az érdeklődést!</h2>
            <p className="mt-3 leading-7 text-[#5f6b63]">{successMessage}</p>
            <button type="button" onClick={() => setOpen(false)} className="mt-6 w-full rounded-2xl bg-[#176b3a] px-5 py-3.5 font-bold text-white transition hover:bg-[#115b30]">Rendben</button>
          </div>
        ) : (
          <>
            <h2 id={titleId} className="mb-2 text-2xl font-black text-[#172019]">{modalTitle}</h2>
            {propertyTitle && (
              <div className="mb-5 rounded-2xl bg-[#f2f7f3] px-4 py-3 text-sm text-[#4d5a51]">
                <span className="font-bold text-[#176b3a]">Ingatlan:</span> {propertyTitle}
                {propertyId ? <div className="mt-1 text-xs text-[#7b857e]">Azonosító: {propertyId}</div> : null}
              </div>
            )}

            <form onSubmit={sendEmail} className="flex flex-col gap-3.5">
              <div className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
                <label htmlFor="website">Weboldal</label>
                <input id="website" name="website" value={form.website} onChange={handleChange} tabIndex={-1} autoComplete="off" />
              </div>
              <label htmlFor={`${titleId}-name`} className="sr-only">Név</label><input id={`${titleId}-name`} name="name" placeholder="Név" value={form.name} onChange={handleChange} autoComplete="name" className="min-h-12 rounded-2xl border border-[#d8d2c7] bg-[#f7f4ee] px-4 py-3 text-[#172019] outline-none transition focus:border-[#8fbc9d] focus:ring-2 focus:ring-[#d9eadf]" required />
              <label htmlFor={`${titleId}-phone`} className="sr-only">Telefonszám</label><input id={`${titleId}-phone`} name="phone" type="tel" placeholder="Telefonszám" value={form.phone} onChange={handleChange} autoComplete="tel" inputMode="tel" className="min-h-12 rounded-2xl border border-[#d8d2c7] bg-[#f7f4ee] px-4 py-3 text-[#172019] outline-none transition focus:border-[#8fbc9d] focus:ring-2 focus:ring-[#d9eadf]" />
              <label htmlFor={`${titleId}-email`} className="sr-only">E-mail</label><input id={`${titleId}-email`} name="email" type="email" placeholder="E-mail" value={form.email} onChange={handleChange} autoComplete="email" className="min-h-12 rounded-2xl border border-[#d8d2c7] bg-[#f7f4ee] px-4 py-3 text-[#172019] outline-none transition focus:border-[#8fbc9d] focus:ring-2 focus:ring-[#d9eadf]" required />
              <label htmlFor={`${titleId}-message`} className="sr-only">Üzenet</label><textarea id={`${titleId}-message`} name="message" placeholder="Üzenet" value={form.message} onChange={handleChange} className="min-h-[130px] rounded-2xl border border-[#d8d2c7] bg-[#f7f4ee] px-4 py-3 text-[#172019] outline-none transition focus:border-[#8fbc9d] focus:ring-2 focus:ring-[#d9eadf]" required />

              {status === "error" ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">{errorText}</p> : null}

              <button type="submit" disabled={loading} className="min-h-12 rounded-2xl bg-[#176b3a] px-5 py-3 font-bold text-white transition hover:bg-[#115b30] disabled:cursor-not-allowed disabled:opacity-50">
                {loading ? "Küldés..." : submitLabel}
              </button>
              <p className="text-center text-xs leading-5 text-[#6c776f]">Az elküldéssel tudomásul veszed az <Link href="/adatvedelem" className="font-bold text-[#176b3a] underline underline-offset-2">adatvédelmi tájékoztatót</Link>.</p>
            </form>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
