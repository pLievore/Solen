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
            }}
          >
            <svg width="60" height="60" viewBox="0 0 1162.21 1080" fill="#ffffff">
              <path d="M965.28,391.76l-133.79-131.22c-29.29-28.73-76.77-28.73-106.05,0l-39.89,39.12c-2.29-.38-4.71.3-6.46,2.03l-38.72,37.97c-1.76,1.72-2.45,4.09-2.07,6.33l-6.08,5.96c-2.29-.38-4.71.3-6.46,2.03l-38.73,37.97c-.65.64-1.15,1.37-1.5,2.15.09,1.2-.12,2.42-.64,3.54.02.22.04.43.08.65l-3.88,3.81-.02-.02-43.67,42.82c-2.89,2.84-7.58,2.84-10.46,0l-5.87-5.75c-2.89-2.84-2.89-7.43,0-10.26l43.67-42.84-127.98-125.52c-29.29-28.73-76.77-28.73-106.05,0l-133.8,131.22c-29.28,28.73-29.28,75.3,0,104.01l301.08,295.29c4.64,4.55,9.58,8.65,14.76,12.26l16.45,16.13c29.29,28.73,76.77,28.73,106.05,0l330.02-323.68c29.29-28.72,29.29-75.29,0-104.01ZM910.75,374.34l-5.87,5.75c-2.88,2.84-7.57,2.84-10.46,0l-45.99-45.11c-2.88-2.83-2.88-7.42,0-10.26l5.87-5.75c2.89-2.84,7.57-2.84,10.46,0l45.99,45.11c2.88,2.83,2.88,7.42,0,10.26Z" />
            </svg>
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
