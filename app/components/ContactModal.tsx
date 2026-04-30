"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import emailjs from "@emailjs/browser";

const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE!;
const TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE!;
const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_KEY!;

type ContactModalProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

export default function ContactModal({
  open,
  setOpen
}: ContactModalProps) {

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
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
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

      setForm({
        name: "",
        email: "",
        message: ""
      });

      setOpen(false);

    } catch (err) {

      console.error(err);
      alert("Hiba történt 😢");

    }

    setLoading(false);
  };

  const modal = open ? (
    <div
      className="
        fixed
        inset-0
        z-[9999]
        flex
        items-start
        justify-center
        overflow-y-auto
        bg-black/70
        p-4
      "
      onClick={() => setOpen(false)}
    >

      <div
        className="
          relative
          mt-20
          w-full
          max-w-md
          rounded-2xl
          bg-white
          p-6
          shadow-2xl
        "
        onClick={(e) => e.stopPropagation()}
      >

        {/* CLOSE */}
        <button
          onClick={() => setOpen(false)}
          className="
            absolute
            top-3
            right-3
            text-gray-500
            transition
            hover:text-black
          "
        >
          ✕
        </button>

        <h2 className="mb-5 text-2xl font-bold text-black">
          Kapcsolatfelvétel
        </h2>

        <form
          onSubmit={sendEmail}
          className="flex flex-col gap-4"
        >

          <input
            name="name"
            placeholder="Név"
            value={form.name}
            onChange={handleChange}
            className="
              rounded-xl
              border
              border-gray-300
              bg-white
              p-3
              text-black
              focus:outline-none
              focus:ring-2
              focus:ring-emerald-500
            "
            required
          />

          <input
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="
              rounded-xl
              border
              border-gray-300
              bg-white
              p-3
              text-black
              focus:outline-none
              focus:ring-2
              focus:ring-emerald-500
            "
            required
          />

          <textarea
            name="message"
            placeholder="Üzenet"
            value={form.message}
            onChange={handleChange}
            className="
              min-h-[140px]
              rounded-xl
              border
              border-gray-300
              bg-white
              p-3
              text-black
              focus:outline-none
              focus:ring-2
              focus:ring-emerald-500
            "
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="
              rounded-xl
              bg-emerald-500
              p-3
              font-semibold
              text-white
              transition
              hover:bg-emerald-400
            "
          >
            {loading ? "Küldés..." : "Üzenet küldése"}
          </button>

        </form>
      </div>
    </div>
  ) : null;

  if (!mounted) return null;

  return createPortal(modal, document.body);
}