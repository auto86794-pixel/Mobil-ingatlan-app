"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type ContactModalProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  propertyTitle?: string;
};

export default function ContactModal({
  open,
  setOpen,
  propertyTitle,
}: ContactModalProps) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((current) => ({
      ...current,
      [e.target.name]: e.target.value,
    }));
  };

  const sendEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          message: form.message,
          propertyTitle,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Hiba történt az üzenet küldésekor.");
      }

      alert("Üzenet elküldve! 🎉");
      setForm({ name: "", email: "", message: "" });
      setOpen(false);
    } catch (error) {
      console.error(error);
      alert("Hiba történt az üzenet küldésekor.");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-black/70 p-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="relative mt-20 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="absolute right-3 top-3 text-gray-500 transition hover:text-black"
          aria-label="Bezárás"
        >
          ✕
        </button>

        <h2 className="mb-5 text-2xl font-bold text-black">
          Kapcsolatfelvétel
        </h2>

        {propertyTitle && (
          <p className="mb-4 text-sm text-gray-600">
            Érdeklődés: <strong>{propertyTitle}</strong>
          </p>
        )}

        <form onSubmit={sendEmail} className="flex flex-col gap-4">
          <input
            name="name"
            placeholder="Név"
            value={form.name}
            onChange={handleChange}
            className="rounded-xl border border-gray-300 bg-white p-3 text-black focus:outline-none focus:ring-2 focus:ring-emerald-500"
            required
          />

          <input
            name="email"
            type="email"
            placeholder="E-mail"
            value={form.email}
            onChange={handleChange}
            className="rounded-xl border border-gray-300 bg-white p-3 text-black focus:outline-none focus:ring-2 focus:ring-emerald-500"
            required
          />

          <textarea
            name="message"
            placeholder="Üzenet"
            value={form.message}
            onChange={handleChange}
            className="min-h-[140px] rounded-xl border border-gray-300 bg-white p-3 text-black focus:outline-none focus:ring-2 focus:ring-emerald-500"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-emerald-500 p-3 font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Küldés..." : "Üzenet küldése"}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
}
