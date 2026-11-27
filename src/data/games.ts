import type { LocalizedText } from "./localized";

export interface UnityGame {
  name: string;
  description: LocalizedText;
  /** Engine or stack shown under the title, e.g. Unity. */
  tech: string;
  /** Local screenshot path, e.g. /games/my-game.webp. */
  imageUrl?: string;
  /** HTTPS CDN entry page, or a local build path for previewing. */
  playUrl: `https://${string}` | `/games/${string}`;
}

const prismfallUrl = process.env.NEXT_PUBLIC_PRISMFALL_URL;
if (prismfallUrl) {
  const url = new URL(prismfallUrl);
  if (url.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_PRISMFALL_URL must be an HTTPS URL.");
  }
}

export const games: UnityGame[] = [
  {
    name: "Prismfall",
    description: {
      it: "Un puzzle di blocchi cadenti al neon, per desktop e mobile. Installabile e giocabile offline dopo il primo download.",
      en: "A neon falling-block puzzle for desktop and mobile. Install it and play offline after the first download.",
    },
    tech: "Unity",
    imageUrl: "/games/prismfall-cover.png",
    playUrl: prismfallUrl
      ? (prismfallUrl as `https://${string}`)
      : "https://prismfall-cxy.pages.dev/",
  },
  {
    name: "Mind Forge",
    description: {
      it: "Undici brevi giochi basati su classici test di psicologia cognitiva, più una sessione quotidiana sulle aree più deboli. Giocabile offline.",
      en: "Eleven short games based on classic cognitive psychology tasks, plus a daily session for your weakest areas. Playable offline.",
    },
    tech: "Next.js",
    imageUrl: "/games/mind-forge.webp",
    playUrl: "https://maku85.github.io/mind-forge/",
  },
];
