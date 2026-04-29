export default function PropertyCardSkeleton() {
  return (
    <div
      className="
        animate-pulse
        overflow-hidden
        rounded-3xl
        border border-zinc-800
        bg-zinc-900
      "
    >

      {/* IMAGE */}
      <div
        className="
          h-56
          w-full
          bg-zinc-800
        "
      />

      {/* CONTENT */}
      <div className="p-5">

        <div
          className="
            mb-4
            h-7
            w-2/3
            rounded-full
            bg-zinc-800
          "
        />

        <div
          className="
            mb-3
            h-5
            w-1/3
            rounded-full
            bg-zinc-800
          "
        />

        <div
          className="
            mb-6
            h-6
            w-1/2
            rounded-full
            bg-zinc-800
          "
        />

        <div
          className="
            h-12
            w-full
            rounded-2xl
            bg-zinc-800
          "
        />

      </div>

    </div>
  );
}