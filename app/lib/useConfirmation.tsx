"use client";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

export function useConfirmation() {
  const [message, setMessage] = useState<string | null>(null);
  const pending = useRef<((confirmed: boolean) => void) | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const id = useId();
  const finish = useCallback((confirmed: boolean) => {
    const resolve = pending.current;
    pending.current = null;
    setMessage(null);
    resolve?.(confirmed);
  }, []);
  const confirm = useCallback((text: string) => {
    if (pending.current) return Promise.resolve(false);
    return new Promise<boolean>((resolve) => {
      pending.current = resolve;
      setMessage(text);
    });
  }, []);
  useEffect(
    () => () => {
      pending.current?.(false);
      pending.current = null;
    },
    [],
  );
  useEffect(() => {
    if (message === null) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        finish(false);
      }
      if (event.key === "Tab") {
        const buttons =
          panel.current?.querySelectorAll<HTMLButtonElement>("button");
        if (!buttons?.length) return;
        const first = buttons[0],
          last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", keydown);
    return () => {
      document.body.style.overflow = oldOverflow;
      document.removeEventListener("keydown", keydown);
      if (previouslyFocused && document.contains(previouslyFocused))
        previouslyFocused.focus();
    };
  }, [message, finish]);
  const dialog =
    message !== null && typeof document !== "undefined"
      ? createPortal(
          <div
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm"
            onClick={() => finish(false)}
          >
            <div
              ref={panel}
              role="dialog"
              aria-modal="true"
              aria-labelledby={`${id}-title`}
              aria-describedby={`${id}-message`}
              className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-3xl border border-[#e2ddd3] bg-white p-6 text-[#18201b] shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <h2 id={`${id}-title`} className="text-xl font-black">
                Művelet megerősítése
              </h2>
              <p
                id={`${id}-message`}
                className="mt-3 whitespace-pre-wrap break-words leading-6"
              >
                {message}
              </p>
              <div className="mt-5 flex justify-end gap-3">
                <button
                  type="button"
                  className="rounded-xl border px-4 py-3 font-semibold"
                  onClick={() => finish(false)}
                >
                  Mégse
                </button>
                <button
                  type="button"
                  className="rounded-xl bg-[#008000] px-4 py-3 font-bold text-white"
                  onClick={() => finish(true)}
                >
                  Megerősítés
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;
  return { confirm, dialog };
}
