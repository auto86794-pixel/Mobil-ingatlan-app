"use client";

type PropertyFiltersProps = {
  city: string;
  maxPrice: string;
  setCity: (value: string) => void;
  setMaxPrice: (value: string) => void;
  onReset: () => void;
};

export default function PropertyFilters({
  city,
  maxPrice,
  setCity,
  setMaxPrice,
  onReset,
}: PropertyFiltersProps) {
  return (
    <div
      className="
        rounded-3xl
        border border-zinc-800
        bg-zinc-900/70
        p-5
        backdrop-blur-xl
        shadow-2xl
        shadow-black/20
      "
    >

      <div className="grid gap-4 md:grid-cols-3">

        {/* CITY */}
        <div className="relative">

          <span
            className="
              absolute
              left-4
              top-1/2
              -translate-y-1/2
              text-zinc-500
            "
          >
            📍
          </span>

          <input
            type="text"
            placeholder="Város"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="
              w-full
              rounded-2xl
              border border-zinc-700
              bg-zinc-800
              py-4
              pl-11
              pr-4
              text-white
              outline-none
              transition-all
              duration-300
              focus:border-yellow-500
              focus:ring-2
              focus:ring-yellow-500/20
            "
          />

        </div>

        {/* PRICE */}
        <div className="relative">

          <span
            className="
              absolute
              left-4
              top-1/2
              -translate-y-1/2
              text-zinc-500
            "
          >
            💰
          </span>

          <input
            type="number"
            placeholder="Maximum ár"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="
              w-full
              rounded-2xl
              border border-zinc-700
              bg-zinc-800
              py-4
              pl-11
              pr-4
              text-white
              outline-none
              transition-all
              duration-300
              focus:border-yellow-500
              focus:ring-2
              focus:ring-yellow-500/20
            "
          />

        </div>

        {/* RESET */}
        <button
          onClick={onReset}
          className="
            rounded-2xl
            bg-yellow-500
            px-5
            py-4
            font-semibold
            text-black
            transition-all
            duration-300
            hover:bg-yellow-400
            hover:shadow-lg
            hover:shadow-yellow-500/20
          "
        >
          Szűrők törlése
        </button>

      </div>

    </div>
  );
}