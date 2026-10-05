"use client";

import { SITE_URL } from "./lib/site";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Home, MapPin, ShieldCheck, Heart, Users, GraduationCap, ChartNoAxesColumnIncreasing, Trees, ArrowRight, Search, ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

import PropertyCard from "./components/property/PropertyCard";
import PropertyCardSkeleton from "./components/property/PropertyCardSkeleton";
import PropertyFilters, {
  type SearchFilters,
} from "./components/property/PropertyFilters";
import { auth, db } from "./lib/firebase";
import { propertyFromFirestore, type PropertyWithId } from "./lib/types";

const emptyFilters: SearchFilters = {
  listingPurpose: "",
  query: "",
  city: "",
  district: "",
  propertyType: "",
  minPrice: "",
  maxPrice: "",
  minArea: "",
  maxArea: "",
  minRooms: "",
  condition: "",
  parking: "",
  balcony: "",
  heating: "",
  sort: "featured",
};

const normalizeSearchText = (value: string) =>
  value
    .toLocaleLowerCase("hu-HU")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9áéíóöőúüű\s-]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const includesText = (value: string, filter: string) =>
  normalizeSearchText(value).includes(normalizeSearchText(filter));

const timestampToMillis = (value: unknown) => {
  if (value && typeof value === "object" && "toMillis" in value) {
    const toMillis = (value as { toMillis?: () => number }).toMillis;
    if (typeof toMillis === "function") return toMillis.call(value);
  }
  if (value instanceof Date) return value.getTime();
  return 0;
};

const uniqueValues = (posts: PropertyWithId[], key: keyof PropertyWithId) =>
  Array.from(
    new Set(
      posts
        .map((post) => post[key])
        .filter(
          (value): value is string =>
            typeof value === "string" && value.trim().length > 0,
        )
        .map((value) => value.trim()),
    ),
  ).sort((a, b) => a.localeCompare(b, "hu-HU"));

export default function HomeClient({
  initialPosts,
}: {
  initialPosts: PropertyWithId[];
}) {
  const routeSearch = useSearchParams();
  const [posts, setPosts] = useState<PropertyWithId[]>(initialPosts);
  const [loading, setLoading] = useState(initialPosts.length === 0);
  const [filters, setFilters] = useState<SearchFilters>(emptyFilters);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [favoriteNotice, setFavoriteNotice] = useState("");
  const searchStateReady = useRef(false);
  const skipNextFilterSave = useRef(true);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("debrecenhomes-search-filters");
      const restored = saved ? { ...emptyFilters, ...JSON.parse(saved) } : emptyFilters;
      const params = new URLSearchParams(routeSearch.toString());
      const purpose = params.get("purpose");
      setFilters({ ...restored, ...(purpose === "sale" || purpose === "rent" ? { listingPurpose: purpose } : {}), ...(params.has("district") ? { district: params.get("district") || "" } : {}) });
    } catch {
      // Hibás vagy régi mentett keresési állapotot figyelmen kívül hagyjuk.
    } finally {
      searchStateReady.current = true;
    }
  }, [routeSearch]);

  useEffect(() => {
    if (!searchStateReady.current) return;
    if (skipNextFilterSave.current) {
      skipNextFilterSave.current = false;
      return;
    }
    sessionStorage.setItem(
      "debrecenhomes-search-filters",
      JSON.stringify(filters),
    );
  }, [filters]);

  useEffect(() => {
    if (loading) return;
    const savedScroll = Number(
      sessionStorage.getItem("debrecenhomes-search-scroll") || "0",
    );
    if (savedScroll > 0)
      requestAnimationFrame(() =>
        window.scrollTo({ top: savedScroll, behavior: "auto" }),
      );

    const rememberScroll = () =>
      sessionStorage.setItem(
        "debrecenhomes-search-scroll",
        String(window.scrollY),
      );
    window.addEventListener("pagehide", rememberScroll);
    return () => {
      rememberScroll();
      window.removeEventListener("pagehide", rememberScroll);
    };
  }, [loading]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        setFavorites([]);
        return;
      }

      try {
        const q = query(
          collection(db, "favorites"),
          where("userId", "==", currentUser.uid),
        );
        const snapshot = await getDocs(q);
        setFavorites(snapshot.docs.map((item) => item.data().postId as string));
      } catch (error) {
        console.error("Kedvencek betöltési hiba:", error);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    return onSnapshot(
      query(collection(db, "posts"), where("status", "==", "active")),
      (snapshot) => {
        setPosts(
          snapshot.docs.map((item) =>
            propertyFromFirestore(item.id, item.data()),
          ),
        );
        setLoading(false);
      },
      (error) => {
        console.error("Élő ingatlanlista hiba:", error);
        setLoading(false);
      },
    );
  }, []);

  const toggleFavorite = async (id: string) => {
    try {
      if (!auth.currentUser) {
        setFavoriteNotice("A kedvencek mentéséhez jelentkezz be.");
        return;
      }

      const userId = auth.currentUser.uid;
      const favoritesRef = collection(db, "favorites");
      const q = query(
        favoritesRef,
        where("userId", "==", userId),
        where("postId", "==", id),
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        await deleteDoc(doc(db, "favorites", snapshot.docs[0].id));
        setFavorites((prev) => prev.filter((favoriteId) => favoriteId !== id));
        setFavoriteNotice("Eltávolítva a kedvencekből.");
      } else {
        await addDoc(favoritesRef, { userId, postId: id });
        setFavorites((prev) => [...prev, id]);
        setFavoriteNotice("Elmentve a kedvencek közé.");
      }
    } catch (error) {
      console.error("Kedvenc módosítási hiba:", error);
    }
  };

  useEffect(() => {
    if (!favoriteNotice) return;
    const timer = window.setTimeout(() => setFavoriteNotice(""), 2200);
    return () => window.clearTimeout(timer);
  }, [favoriteNotice]);

  const activePosts = useMemo(
    () =>
      posts.filter(
        (post) =>
          post.status === "active" &&
          Boolean(post.title && post.city && post.price > 0 && post.imageUrl),
      ),
    [posts],
  );

  const options = useMemo(
    () => ({
      districts: uniqueValues(activePosts, "district"),
      propertyTypes: Array.from(new Set(["lakás", "családi ház", "ikerház", "sorház", "telek", "egyéb", ...uniqueValues(activePosts, "propertyType").map(value => value.trim().toLocaleLowerCase("hu-HU"))])),
      conditions: uniqueValues(activePosts, "condition"),
      parking: uniqueValues(activePosts, "parking"),
      balconies: uniqueValues(activePosts, "balcony"),
      heating: uniqueValues(activePosts, "heating"),
    }),
    [activePosts],
  );

  const filteredPosts = useMemo(() => {
    const result = activePosts.filter((post) => {
      if (filters.listingPurpose && post.listingPurpose !== filters.listingPurpose) return false;
      if (filters.query) {
        const searchable = [
          post.title,
          post.city,
          post.district,
          post.propertyType,
          post.condition,
          post.parking,
          post.balcony,
          post.heating,
        ]
          .filter(Boolean)
          .join(" ");
        if (!includesText(searchable, filters.query)) return false;
      }

      if (filters.city && !includesText(post.city, filters.city)) return false;
      if (filters.district && post.district !== filters.district) return false;
      if (filters.propertyType && normalizeSearchText(post.propertyType) !== normalizeSearchText(filters.propertyType))
        return false;
      if (filters.condition && post.condition !== filters.condition)
        return false;
      if (filters.parking && post.parking !== filters.parking) return false;
      if (filters.balcony && post.balcony !== filters.balcony) return false;
      if (filters.heating && post.heating !== filters.heating) return false;

      if (filters.minPrice && post.price < Number(filters.minPrice))
        return false;
      if (filters.maxPrice && post.price > Number(filters.maxPrice))
        return false;
      if (filters.minArea && post.area < Number(filters.minArea)) return false;
      if (filters.maxArea && post.area > Number(filters.maxArea)) return false;
      if (filters.minRooms && post.rooms < Number(filters.minRooms))
        return false;

      return true;
    });

    return result.sort((a, b) => {
      if (filters.sort === "priceAsc") return a.price - b.price;
      if (filters.sort === "priceDesc") return b.price - a.price;
      if (filters.sort === "newest") {
        return timestampToMillis(b.createdAt) - timestampToMillis(a.createdAt);
      }

      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return timestampToMillis(b.createdAt) - timestampToMillis(a.createdAt);
    });
  }, [activePosts, filters]);

  const isNewPost = (post: PropertyWithId) => {
    const created = timestampToMillis(post.createdAt);
    return created > 0 && Date.now() - created <= 7 * 24 * 60 * 60 * 1000;
  };

  const featuredPosts = filteredPosts.filter((post) => post.featured);
  const normalPosts = filteredPosts.filter((post) => !post.featured);

  const update = (key: keyof SearchFilters, value: string) => setFilters(previous => ({ ...previous, [key]: value }));
  const showResults = () => document.getElementById("results")?.scrollIntoView({ behavior: "smooth", block: "start" });
  const hasFilters = Object.entries(filters).some(([key, value]) => key !== "sort" && Boolean(value));
  const recommended = hasFilters ? filteredPosts : [...featuredPosts, ...normalPosts].slice(0, 4);
  const benefits = [
    { icon: Home, title: "Széles kínálat", text: "Lakások, házak, új építésű ingatlanok Debrecenben" },
    { icon: MapPin, title: "Városrészek szerint", text: "Találd meg a számodra ideális környéket" },
    { icon: ShieldCheck, title: "Átlátható hirdetések", text: "Az otthon legfontosabb adatai, egy helyen" },
    { icon: Heart, title: "Könnyű használat", text: "Gyors keresés, kedvencek mentése" },
    { icon: Users, title: "Helyi szemlélet", text: "Debrecenre és környékére fókuszálva" },
  ];
  const websiteJsonLd = { "@context": "https://schema.org", "@type": "WebSite", name: "Debreceni Otthonok", url: SITE_URL, inLanguage: "hu-HU", description: "Eladó és kiadó ingatlanok Debrecenben és környékén." };
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd).replace(/</g, "\\u003c") }} />
    <main className="do-home">
      <section className="do-hero" aria-labelledby="home-title">
        <Image src="/debrecen-nagytemplom.webp" alt="A debreceni Nagytemplom és a főtér naplementében" fill priority sizes="100vw" className="do-hero-image" />
        <div className="do-hero-shade" />
        <div className="do-container do-hero-inner">
          <div className="do-hero-copy"><p className="do-eyebrow">Otthonok. Lehetőségek. Debrecen.</p>
            <h1 id="home-title">Találd meg<br />az otthonod<br />Debrecenben.</h1>
            <p className="do-hero-description">Eladó és kiadó lakások, házak, új építésű ingatlanok<br className="hidden sm:block" /> egy helyen – egyszerűen, átláthatóan.</p>
          </div>
          <form id="ingatlanok" className="do-search" onSubmit={event => { event.preventDefault(); if (!filters.listingPurpose) update("listingPurpose", "sale"); showResults(); }}>
            <div className="do-purpose" aria-label="Hirdetés típusa">
              <button type="button" aria-pressed={filters.listingPurpose !== "rent"} className={filters.listingPurpose !== "rent" ? "is-active" : ""} onClick={() => update("listingPurpose", "sale")}>Eladó</button>
              <button type="button" aria-pressed={filters.listingPurpose === "rent"} className={filters.listingPurpose === "rent" ? "is-active" : ""} onClick={() => update("listingPurpose", "rent")}>Kiadó</button>
            </div>
            <label className="do-search-query"><Search size={19} aria-hidden="true" /><span className="sr-only">Városrész vagy kulcsszó</span><input value={filters.query} onChange={event => update("query", event.target.value)} placeholder="Város, városrész, kulcsszó…" /></label>
            <label className="do-search-select"><span className="sr-only">Ingatlan típusa</span><select value={filters.propertyType} onChange={event => update("propertyType", event.target.value)}><option value="">Ingatlan típusa</option>{options.propertyTypes.map(value => <option key={value} value={value}>{value.charAt(0).toLocaleUpperCase("hu-HU") + value.slice(1)}</option>)}</select></label>
            <label className="do-search-select"><span className="sr-only">Maximum ár forintban</span><input type="number" min="0" step="10000" value={filters.maxPrice} onChange={event => update("maxPrice", event.target.value)} placeholder="Maximum ár (Ft)" /></label>
            <button className="do-search-submit" type="submit">Keresés <ArrowRight size={17} /></button>
          </form>
        </div>
      </section>
      <section className="do-container do-benefits" aria-label="Miért Debreceni Otthonok?">{benefits.map(item => <div className="do-benefit" key={item.title}><item.icon aria-hidden="true" /><div><h2>{item.title}</h2><p>{item.text}</p></div></div>)}</section>
      <section id="results" className="do-container do-listings" aria-labelledby="listings-title">
        <div className="do-section-heading"><div><p className="do-section-label">{hasFilters ? "Aktuális kínálat" : "Kiemelt ingatlanok"}</p><h2 id="listings-title">{hasFilters ? "Ingatlanok a keresésed szerint" : "Ajánlott ingatlanok Debrecenben"}</h2></div><button type="button" className="do-text-link" onClick={() => { setAdvancedOpen(value => !value); }}>{advancedOpen ? "Szűrők bezárása" : "Összes megtekintése és szűrése"} <ChevronDown size={17} /></button></div>
        {advancedOpen && <div className="do-advanced"><PropertyFilters filters={filters} setFilters={setFilters} options={options} resultCount={filteredPosts.length} onReset={() => setFilters(emptyFilters)} onShowResults={showResults} /></div>}
        {hasFilters && <div className="do-result-count"><p>{filteredPosts.length} ingatlan felel meg a keresésnek.</p><button type="button" onClick={() => setFilters(emptyFilters)}>Szűrők törlése</button></div>}
        <div className="do-property-grid">{loading ? Array.from({ length: 4 }).map((_, index) => <PropertyCardSkeleton key={index} />) : (advancedOpen ? filteredPosts : recommended).map(post => <PropertyCard key={post.id} {...post} isNew={isNewPost(post)} isFavorite={favorites.includes(post.id)} onToggleFavorite={() => void toggleFavorite(post.id)} />)}</div>
        {!loading && recommended.length === 0 && <div className="do-empty"><Home size={36} /><h3>Most nincs pontos találat.</h3><p>Próbálj tágabb keresést, vagy írd meg, milyen otthont keresel.</p><button type="button" onClick={() => setFilters(emptyFilters)}>Összes ingatlan</button><a href="mailto:info@debrecenhomes.hu?subject=Ingatlant%20keresek%20Debrecenben">Elmondom, mit keresek</a></div>}
      </section>
      <section id="debrecen" className="do-container do-city" aria-labelledby="city-title">
        <div className="do-city-photo"><Image src="/debrecen-varoskep.webp" alt="Debrecen belvárosa és a Nagytemplom" fill sizes="(min-width: 1024px) 38vw, 100vw" className="object-cover" /><div><MapPin size={25} /><p><strong>Fedezd fel Debrecent</strong><span>Egy város, ahol jó élni</span></p></div></div>
        <div className="do-city-copy"><p className="do-section-label">Miért Debrecen?</p><h2 id="city-title">Egy város, sok lehetőség</h2><p>Debrecen élhető és dinamikus város: egyetemi élet, zöld környékek, munkahelyek és pezsgő kultúra találkoznak itt. Akár saját otthont, akár befektetési lehetőséget keresel, érdemes megismerned a városrészeit.</p><button type="button" className="do-city-button" onClick={() => { setAdvancedOpen(true); showResults(); }}>Megnézem a városrészek kínálatát <ArrowRight size={17} /></button></div>
        <div className="do-city-facts">{[{ icon: GraduationCap, title: "Egyetemi város", text: "Hallgatók, kutatás, pezsgő élet" }, { icon: ChartNoAxesColumnIncreasing, title: "Folyamatos fejlődés", text: "Új lakónegyedek és lehetőségek" }, { icon: Trees, title: "Zöld város", text: "Nagyerdő, parkok, természet" }, { icon: Heart, title: "Otthon minden élethelyzetre", text: "Városi lakás vagy kertvárosi ház" }].map(item => <div key={item.title}><item.icon aria-hidden="true" /><p><strong>{item.title}</strong><span>{item.text}</span></p></div>)}</div>
      </section>
      {favoriteNotice && <div role="status" aria-live="polite" className="do-favorite-notice">{favoriteNotice}</div>}
    </main>
  </>;
}
