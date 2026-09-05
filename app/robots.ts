import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/dashboard", "/create", "/edit", "/login", "/favorites"],
    },
    sitemap: "https://debrecenhomes.hu/sitemap.xml",
    host: "https://debrecenhomes.hu",
  };
}
