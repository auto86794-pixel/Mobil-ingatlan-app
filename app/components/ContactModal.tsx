"use client";

import { useState } from "react";
import emailjs from "@emailjs/browser";

const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE!;
const TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE!;
const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_KEY!;

export default function ContactModal() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    message: ""
  });

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

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Kapcsolat
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md relative">

            <button
              onClick={() => setOpen(false)}
              className="absolute top-2 right-2"
            >
              ✕
            </button>

            <h2 className="text-xl mb-4">Kapcsolat</h2>

            <form onSubmit={sendEmail} className="flex flex-col gap-3">
              <input
                name="name"
                placeholder="Név"
                value={form.name}
                onChange={handleChange}
                className="border p-2"
                required
              />

              <input
                name="email"
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                className="border p-2"
                required
              />

              <textarea
                name="message"
                placeholder="Üzenet"
                value={form.message}
                onChange={handleChange}
                className="border p-2"
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
      )}
    </>
  );
}