import { pad, type Duration } from "./format";

const W = 1080;
const H = 1350;
const GLOW = "#3dff6e";

type Card = { time: Duration; usedPct: number; subtitle: string; heading?: string };

function cssFont(variable: string, fallback: string) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  return value || fallback;
}

/** Renders the clock as a portrait PNG (Instagram-story friendly). */
export async function renderShareCard({ time, usedPct, subtitle, heading = "The time I have left" }: Card): Promise<Blob> {
  const mono = cssFont("--font-clock", "monospace");
  const sans = cssFont("--font-geist-sans", "system-ui, sans-serif");
  await Promise.all([document.fonts.load(`160px ${mono}`), document.fonts.load(`40px ${sans}`)]);

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);
  const halo = ctx.createRadialGradient(W / 2, 560, 0, W / 2, 560, 700);
  halo.addColorStop(0, "rgba(61,255,110,0.14)");
  halo.addColorStop(1, "rgba(61,255,110,0)");
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  const glowText = (text: string, x: number, y: number, font: string, blur = 28) => {
    ctx.font = font;
    ctx.fillStyle = GLOW;
    ctx.shadowColor = "rgba(61,255,110,0.8)";
    ctx.shadowBlur = blur;
    ctx.fillText(text, x, y);
    ctx.shadowBlur = 0;
  };

  glowText("IN TIME", W / 2, 190, `64px ${mono}`, 18);
  ctx.font = `30px ${sans}`;
  ctx.fillStyle = "#a1a1aa";
  ctx.fillText(`${heading}, according to today's data`, W / 2, 250);

  // Big clock: years and days on the first line, hh:mm:ss on the second.
  const units: [string, string][] = [
    [pad(time.years, 2), "YEARS"],
    [pad(time.days, 3), "DAYS"],
  ];
  const fine: [string, string][] = [
    [pad(time.hours, 2), "HOURS"],
    [pad(time.minutes, 2), "MIN"],
    [pad(time.seconds, 2), "SEC"],
  ];
  drawRow(units, 560, 230, 380);
  drawRow(fine, 820, 150, 260);

  function drawRow(row: [string, string][], y: number, size: number, gap: number) {
    const start = W / 2 - ((row.length - 1) * gap) / 2;
    row.forEach(([value, label], i) => {
      const x = start + i * gap;
      glowText(value, x, y, `${size}px ${mono}`);
      ctx.font = `24px ${mono}`;
      ctx.fillStyle = "#71717a";
      ctx.fillText(label, x, y + 56);
      if (i < row.length - 1) {
        ctx.font = `${size * 0.8}px ${mono}`;
        ctx.fillStyle = "rgba(61,255,110,0.35)";
        ctx.fillText(":", x + gap / 2, y - size * 0.08);
      }
    });
  }

  // Life bar.
  const barX = 140;
  const barW = W - 280;
  const barY = 1010;
  ctx.fillStyle = "#18181b";
  roundRect(ctx, barX, barY, barW, 14, 7);
  ctx.fillStyle = GLOW;
  ctx.shadowColor = "rgba(61,255,110,0.8)";
  ctx.shadowBlur = 16;
  roundRect(ctx, barX, barY, Math.max(14, (barW * usedPct) / 100), 14, 7);
  ctx.shadowBlur = 0;
  ctx.font = `28px ${mono}`;
  ctx.fillStyle = "#a1a1aa";
  ctx.fillText(`${usedPct.toFixed(1)}% already spent`, W / 2, barY + 70);

  ctx.font = `30px ${sans}`;
  ctx.fillStyle = "#e4e4e7";
  ctx.fillText(subtitle, W / 2, 1180);
  ctx.font = `24px ${sans}`;
  ctx.fillStyle = "#52525b";
  ctx.fillText("Statistical estimate, not a prediction.", W / 2, 1250);

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))), "image/png"),
  );
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

/** Uses the native share sheet when it accepts files, otherwise downloads the PNG. */
export async function shareOrDownload(blob: Blob): Promise<"shared" | "downloaded" | "cancelled"> {
  const file = new File([blob], "in-time.png", { type: "image/png" });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: "In Time", text: "My time left." });
      return "shared";
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return "cancelled";
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return "downloaded";
}
