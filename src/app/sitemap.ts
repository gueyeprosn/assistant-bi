import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/demo`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/login`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/legal/confidentialite`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/legal/cgu`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/legal/cgv`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
