import { cache } from "react";
import { knownDate, propertySeo, serializableProperty, jsonLdString } from "@/app/lib/propertySeo";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";

import { db } from "@/app/lib/firebase";
import { propertyFromFirestore } from "@/app/lib/types";
import PropertyClient from "./PropertyClient";

const SITE_URL = "https://debrecenhomes.hu";

export const dynamic = "force-dynamic";

const getProperty = cache(async (id: string) => {
  try {
    const snapshot = await getDoc(doc(db, "posts", id));
    if (!snapshot.exists()) return null;
    return propertyFromFirestore(snapshot.id, snapshot.data());
  } catch {
    return null;
  }
});

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

  const { title, description } = propertySeo(property);

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
  if (!property || property.status !== "active") notFound();

  const jsonLd = property
    ? {
        "@context": "https://schema.org",
        "@type": "RealEstateListing",
        name: property.title,
        description: property.description || undefined,
        url: `${SITE_URL}/post/${property.id}`,
        image: property.images.length ? property.images : property.imageUrl ? [property.imageUrl] : undefined,
        datePosted: knownDate(property.createdAt)?.toISOString(),
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
          dangerouslySetInnerHTML={{ __html: jsonLdString(jsonLd) }}
        />
      ) : null}
      <PropertyClient key={property.id} initialProperty={serializableProperty(property)} />
    </>
  );
}
