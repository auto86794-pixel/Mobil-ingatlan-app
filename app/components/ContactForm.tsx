"use client";

import { useState } from "react";

export default function ContactForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const sendEmail = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
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
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Something went wrong"
        );
      }

      alert("Üzenet elküldve! 🎉");

      setForm({
        name: "",
        email: "",
        message: "",
      });

    } catch (error) {
      console.error(error);

      alert("Hiba történt 😢");
    }

    setLoading(false);
  };

  return (
    <form
      onSubmit={sendEmail}
      className="flex flex-col gap-4 max-w-md"
    >
      <input
        type="text"
        name="name"
        placeholder="Név"
        value={form.name}
        onChange={handleChange}
        className="
          border
          border-gray-300
          p-3
          rounded-md
          outline-none
        "
        required
      />

      <input
        type="email"
        name="email"
        placeholder="Email"
        value={form.email}
        onChange={handleChange}
        className="
          border
          border-gray-300
          p-3
          rounded-md
          outline-none
        "
        required
      />

      <textarea
        name="message"
        placeholder="Üzenet"
        value={form.message}
        onChange={handleChange}
        className="
          border
          border-gray-300
          p-3
          rounded-md
          outline-none
          min-h-[140px]
        "
        required
      />

      <button
        type="submit"
        disabled={loading}
        className="
          bg-black
          text-white
          p-3
          rounded-md
          transition
          hover:opacity-90
          disabled:opacity-50
        "
      >
        {loading ? "Küldés..." : "Küldés"}
      </button>
    </form>
  );
}