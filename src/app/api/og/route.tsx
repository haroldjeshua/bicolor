import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function loadFont(): Promise<ArrayBuffer | null> {
  try {
    const cssUrl =
      "https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400..700&display=swap";
    const css = await (await fetch(cssUrl)).text();

    const match = css.match(/src:\s*url\(([^)]+)\)/);
    if (!match) return null;
    const fontUrl = match[1].replace(/['"]/g, "");
    const res = await fetch(fontUrl);
    return res.arrayBuffer();
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("color");
  const colorValue = raw || "#1a2b3c";

  const culori = await import("culori");
  const parsed = culori.parse(colorValue);

  let hex = "#1a2b3c";
  let oklchStr = "oklch(0.28 0.04 220)";

  if (parsed) {
    const rgb = culori.converter("rgb")(parsed);
    if (rgb) {
      const r = Math.round((rgb.r ?? 0) * 255)
        .toString(16)
        .padStart(2, "0");
      const g = Math.round((rgb.g ?? 0) * 255)
        .toString(16)
        .padStart(2, "0");
      const b = Math.round((rgb.b ?? 0) * 255)
        .toString(16)
        .padStart(2, "0");
      hex = `#${r}${g}${b}`;
    }

    const oklch = culori.converter("oklch")(parsed);
    if (oklch) {
      const l = typeof oklch.l === "number" ? oklch.l.toFixed(4) : "0";
      const c = typeof oklch.c === "number" ? oklch.c.toFixed(4) : "0";
      const h = typeof oklch.h === "number" ? oklch.h.toFixed(1) : "0";
      oklchStr = `oklch(${l} ${c} ${h})`;
    }
  }

  const fontData = await loadFont();
  const fonts = fontData
    ? [
        {
          name: "Geist Mono",
          data: fontData,
          weight: 400 as const,
          style: "normal" as const,
        },
      ]
    : [];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#09090b",
          color: "#fafafa",
          fontFamily: fontData ? "Geist Mono" : "monospace",
          padding: "48px",
        }}
      >
        <div
          style={{ display: "flex", alignItems: "center", gap: "4px" }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 32 32"
            fill="none"
            style={{ opacity: 0.6 }}
          >
            <circle cx="16" cy="16" r="14" stroke="#a1a1aa" strokeWidth="2" />
            <circle cx="10" cy="12" r="4" fill="#f97316" />
            <circle cx="22" cy="20" r="4" fill="#3b82f6" />
          </svg>
          <span
            style={{
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              color: "#a1a1aa",
            }}
          >
            bicolor
          </span>
        </div>

        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            gap: "64px",
          }}
        >
          <div
            style={{
              width: 420,
              height: 420,
              borderRadius: 16,
              backgroundColor: hex,
              border: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "flex-end",
              padding: "16px",
            }}
          >
            <div
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.5)",
                backgroundColor: "rgba(0,0,0,0.4)",
                padding: "4px 10px",
                borderRadius: 6,
                backdropFilter: "blur(4px)",
              }}
            >
              {hex}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div
              style={{
                fontSize: 56,
                fontWeight: 700,
                letterSpacing: "-0.03em",
                lineHeight: 1,
              }}
            >
              {hex}
            </div>
            <div
              style={{
                fontSize: 26,
                color: "#a1a1aa",
                lineHeight: 1.3,
              }}
            >
              {oklchStr}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 14,
            color: "#52525b",
          }}
        >
          <span>Pick. Convert. Palette.</span>
          <span>bicolor.app</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: fonts.length > 0 ? fonts : undefined,
    }
  );
}
