import PropertyCardSkeleton from "./components/property/PropertyCardSkeleton";

export default function Loading() {
  return (
    <main className="min-h-screen px-4 py-6 md:px-6 md:py-10" aria-busy="true" aria-label="Oldal betöltése">
      <div className="mx-auto mb-8 h-56 max-w-[1500px] animate-pulse rounded-[32px] bg-[#ece7de] sm:h-72" />
      <div className="mx-auto grid max-w-[1500px] gap-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => <PropertyCardSkeleton key={index} />)}
      </div>
    </main>
  );
}
