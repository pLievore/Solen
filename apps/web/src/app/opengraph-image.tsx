import { ImageResponse } from "next/og";

export const alt = "Vendy — Venda seus eletrônicos usados";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #07150d 0%, #0a0a0a 70%)",
          color: "white",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            maxWidth: 900,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 92,
              height: 92,
              borderRadius: 24,
              background: "#15803d",
              fontSize: 52,
              fontWeight: 800,
            }}
          >
            V
          </div>
          <div style={{ marginTop: 36, fontSize: 68, fontWeight: 800 }}>
            Venda seus usados na hora
          </div>
          <div style={{ marginTop: 22, fontSize: 30, color: "#cbd5e1" }}>
            Avaliação gratuita e proposta imediata para seus eletrônicos.
          </div>
          <div
            style={{
              marginTop: 34,
              padding: "14px 26px",
              borderRadius: 999,
              background: "#15803d",
              fontSize: 24,
              fontWeight: 700,
            }}
          >
            vendybrasil.com
          </div>
        </div>
      </div>
    ),
    size,
  );
}
