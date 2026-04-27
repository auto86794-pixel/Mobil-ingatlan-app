"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import emailjs from "@emailjs/browser";

const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE!;
const TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE!;
const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_KEY!;

export default function ContactModal() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    message: ""
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const sendEmail = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      await emailjs.send(
        SERVICE_ID,
        TEMPLATE_ID,
        {
          name: form.name,
          email: form.email,
          message: form.message
        },
        PUBLIC_KEY
      );

      alert("Üzenet elküldve! 🎉");
      setForm({ name: "", email: "", message: "" });
      setOpen(false);
    } catch (err) {
      console.error(err);
      alert("Hiba történt 😢");
    }

    setLoading(false);
  };

  const modal = open ? (
    <div
      className="fixed inset-0 bg-black/70 z-[9999] flex items-start justify-center overflow-y-auto"
      onClick={() => setOpen(false)}
    >
      <div
        className="bg-white w-full max-w-md rounded-xl p-6 mt-20 shadow-xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setOpen(false)}
          className="absolute top-2 right-2 text-gray-500"
        >
          ✕
        </button>

        <h2 className="text-xl font-semibold mb-4">Kapcsolat</h2>

        <form onSubmit={sendEmail} className="flex flex-col gap-3">
          <input
            name="name"
            placeholder="Név"
            value={form.name}
            onChange={handleChange}
            className="border p-2 rounded"
            required
          />

          <input
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="border p-2 rounded"
            required
          />

          <textarea
            name="message"
            placeholder="Üzenet"
            value={form.message}
            onChange={handleChange}
            className="border p-2 rounded min-h-[120px]"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="bg-black text-white p-2 rounded"
          >
            {loading ? "Küldés..." : "Küldés"}
          </button>
        </form>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Kapcsolat
      </button>

      {mounted && createPortal(modal, document.body)}
    </>
  );
}