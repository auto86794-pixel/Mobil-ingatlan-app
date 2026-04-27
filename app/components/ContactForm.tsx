"use client";

import { useState } from "react";
import emailjs from "@emailjs/browser";

const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE!;
const TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE!;
const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_KEY!;

export default function ContactForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: ""
  });

  const [loading, setLoading] = useState(false);

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

    } catch (error) {
      console.error(error);
      alert("Hiba történt 😢");
    }

    setLoading(false);
  };

  return (
    <form onSubmit={sendEmail} className="flex flex-col gap-3 max-w-md">
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
  );
}