import { ImageResponse } from "next/og";

export const alt = "Assistant Bi — secrétaire WhatsApp, Dakar";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "#0B1F3A",
        }}
      >
        <div style={{ color: "#C9A84C", fontSize: 28, fontWeight: 700, letterSpacing: 4 }}>
          ASSISTANT BI
        </div>
        <div style={{ color: "#FFFFFF", fontSize: 64, fontWeight: 700, marginTop: 16, lineHeight: 1.15 }}>
          La secrétaire WhatsApp des professionnels de Dakar
        </div>
        <div style={{ color: "#C5D0DE", fontSize: 28, marginTop: 28 }}>
          Français + wolof · Wave · Orange Money
        </div>
      </div>
    ),
    { ...size },
  );
}
