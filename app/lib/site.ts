// Az új domain élesítésekor Vercelben: NEXT_PUBLIC_SITE_URL=https://debreceniotthonok.hu
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://debrecenhomes.hu").replace(/\/$/, "");
