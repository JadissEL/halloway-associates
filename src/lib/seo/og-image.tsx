import { ImageResponse } from "next/og";

export const ogImageSize = { width: 1200, height: 630 };

type OgImageContent = {
  eyebrow: string;
  title: string;
  subtitle: string;
};

export function renderOgImage({ eyebrow, title, subtitle }: OgImageContent) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "72px 80px",
          background: "#f2eef7",
          fontFamily: "Inter, Arial, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "48px 56px",
            borderRadius: "24px",
            background: "#ebe6f2",
            border: "1px solid #e8e8e8",
          }}
        >
          <p
            style={{
              margin: 0,
              marginBottom: 16,
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#9a8555",
            }}
          >
            {eyebrow}
          </p>
          <p
            style={{
              margin: 0,
              marginBottom: 16,
              fontSize: 56,
              fontWeight: 700,
              lineHeight: 1.1,
              color: "#1a1a1a",
              maxWidth: 900,
            }}
          >
            {title}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: 26,
              lineHeight: 1.35,
              color: "#4a4a4a",
              maxWidth: 820,
            }}
          >
            {subtitle}
          </p>
        </div>
      </div>
    ),
    ogImageSize,
  );
}
