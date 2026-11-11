"use client";

import { useRef, useState, type Dispatch, type SetStateAction } from "react";

type Props = {
  images: string[];
  setImages: Dispatch<SetStateAction<string[]>>;
  onRemove: (image: string) => void | Promise<void>;
  disabled?: boolean;
};

export default function SortableImageGallery({ images, setImages, onRemove, disabled = false }: Props) {
  const dragged = useRef<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");

  function move(image: string, target: string) {
    if (disabled || image === target) return;
    setImages(previous => {
      const from = previous.indexOf(image);
      const to = previous.indexOf(target);
      if (from < 0 || to < 0) return previous;
      const next = [...previous];
      next.splice(from, 1);
      next.splice(to, 0, image);
      return next;
    });
    setAnnouncement("A képek sorrendje módosult. A véglegesítéshez mentsd az ingatlant.");
  }

  if (!images.length) return null;
  const buttonClass = "min-h-11 rounded-lg bg-white px-3 py-2 text-sm font-bold text-[#172019] border border-[#d8d2c7] disabled:opacity-40 disabled:cursor-default focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#008000]";

  return (
    <section className="mb-8" aria-label="Képek sorrendezése">
      <p className="mb-3 text-sm text-[#526057]">Húzd a képet a kívánt helyre, vagy használd az Előrébb és Hátrébb gombokat. Az első kép a borító. A sorrendet az ingatlan mentése véglegesíti.</p>
      <p className="sr-only" role="status" aria-live="polite">{announcement}</p>
      <ol className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {images.map((image, index) => (
          <li key={image}
            onDragOver={event => {
              if (disabled || !dragged.current) return;
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
              setDropTarget(image);
            }}
            onDrop={event => {
              event.preventDefault();
              if (dragged.current) move(dragged.current, image);
              dragged.current = null;
              setDropTarget(null);
            }}
            className={`overflow-hidden rounded-2xl border-2 bg-[#f7f4ee] ${dropTarget === image ? "border-[#008000]" : "border-[#e2ddd3]"}`}>
            <div className="relative">
              <div draggable={!disabled} onDragStart={event => {
                if (disabled) { event.preventDefault(); return; }
                dragged.current = image;
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", image);
              }} onDragEnd={() => { dragged.current = null; setDropTarget(null); }}
                className={disabled ? "" : "cursor-grab active:cursor-grabbing"} title="Húzd a képet a kívánt helyre">
                <img src={image} alt={`Ingatlan ${index + 1}. képe`} draggable={false} className="h-44 w-full select-none object-cover" />
              </div>
              <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-bold text-[#172019]">{index + 1}. kép{index === 0 ? " · BORÍTÓ" : ""}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 p-2">
              <button type="button" className={buttonClass} disabled={disabled || index === 0} aria-label={`${index + 1}. kép előrébb helyezése`} onClick={() => move(image, images[index - 1])}>← Előrébb</button>
              <button type="button" className={buttonClass} disabled={disabled || index === images.length - 1} aria-label={`${index + 1}. kép hátrébb helyezése`} onClick={() => move(image, images[index + 1])}>Hátrébb →</button>
              <button type="button" className={buttonClass} disabled={disabled || index === 0} aria-label={`${index + 1}. kép beállítása borítónak`} onClick={() => move(image, images[0])}>Borítónak</button>
              <button type="button" className={`${buttonClass} !bg-red-600 !text-white !border-red-600`} disabled={disabled} aria-label={`${index + 1}. kép törlése`} onClick={() => void onRemove(image)}>Törlés</button>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
