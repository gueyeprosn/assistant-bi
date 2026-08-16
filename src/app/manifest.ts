import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Assistant Bi",
    short_name: "Assistant Bi",
    description: "Secrétaire WhatsApp pour professionnels sénégalais.",
    start_url: "/app",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0B1F3A",
    lang: "fr",
    icons: [
      {
        src: "/brand/icon.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/brand/icon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
