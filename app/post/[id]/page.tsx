import type { Metadata } from "next";
import { doc, getDoc } from "firebase/firestore";

import { db } from "@/app/lib/firebase";
import { propertyFromFirestore } from "@/app/lib/types";
import PropertyClient from "./PropertyClient";

const SITE_URL = "https://debrecenhomes.hu";

async function getProperty(id: string) {
  try {
    const snapshot = await getDoc(doc(db, "posts", id));
    if (!snapshot.exists()) return null;
    return propertyFromFirestore(snapshot.id, snapshot.data());
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const property = await getProperty(params.id);

  if (!property) {
    return {
      title: "Ingatlan | DebrecenHomes",
      description: "Eladó és kiadó ingatlanok Debrecenben a DebrecenHomes kínálatából.",
      robots: { index: false, follow: true },
    };
  }

  const location = [property.city, property.district].filter(Boolean).join(", ");
  const title = `${property.title} | DebrecenHomes`;
  const description = [
    location,
    property.propertyType,
    property.area ? `${property.area} m²` : "",
    property.rooms ? `${property.rooms} szoba` : "",
    property.price ? `${property.price.toLocaleString("hu-HU")} Ft` : "",
  ]
    .filter(Boolean)
    .join(" • ")
    .slice(0, 160);

  const url = `${SITE_URL}/post/${property.id}`;
  const images = property.imageUrl ? [{ url: property.imageUrl, alt: property.title }] : [];

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      locale: "hu_HU",
      url,
      siteName: "DebrecenHomes",
      title,
      description,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: property.imageUrl ? [property.imageUrl] : [],
    },
    robots: {
      index: property.status === "active",
      follow: true,
    },
  };
}

export default async function PropertyPage({ params }: { params: { id: string } }) {
  const property = await getProperty(params.id);

  const jsonLd = property
    ? {
        "@context": "https://schema.org",
        "@type": "RealEstateListing",
        name: property.title,
        description: property.description || undefined,
        url: `${SITE_URL}/post/${property.id}`,
        image: property.images.length ? property.images : property.imageUrl ? [property.imageUrl] : undefined,
        datePosted:
          property.createdAt && typeof property.createdAt === "object" && "toDate" in property.createdAt
            ? (property.createdAt as { toDate: () => Date }).toDate().toISOString()
            : undefined,
        offers: {
          "@type": "Offer",
          priceCurrency: "HUF",
          price: property.price,
          availability:
            property.status === "active"
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
        },
        address: {
          "@type": "PostalAddress",
          addressLocality: property.city,
          addressRegion: "Hajdú-Bihar",
          addressCountry: "HU",
        },
        geo:
          property.lat && property.lng
            ? {
                "@type": "GeoCoordinates",
                latitude: property.lat,
                longitude: property.lng,
              }
            : undefined,
      }
    : null;

  return (
    <>
      {jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ) : null}
      <PropertyClient />
    </>
  );
}
