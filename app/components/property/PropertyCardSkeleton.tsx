export default function PropertyCardSkeleton() {
  return (
    <div
      className="
        animate-pulse
        overflow-hidden
        rounded-3xl
        border border-[#e2ddd3]
        bg-white
      "
    >

      {/* IMAGE */}
      <div
        className="
          h-56
          w-full
          bg-[#f5f2ec]
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
            bg-[#f5f2ec]
          "
        />

        <div
          className="
            mb-3
            h-5
            w-1/3
            rounded-full
            bg-[#f5f2ec]
          "
        />

        <div
          className="
            mb-6
            h-6
            w-1/2
            rounded-full
            bg-[#f5f2ec]
          "
        />

        <div
          className="
            h-12
            w-full
            rounded-2xl
            bg-[#f5f2ec]
          "
        />

      </div>

    </div>
  );
}