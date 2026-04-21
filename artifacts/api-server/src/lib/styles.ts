/**
 * Server-managed catalog of interior design styles. The mobile app fetches
 * this at runtime so the curated list can evolve without an app store update.
 */

export interface DesignStyle {
  id: string;
  name: string;
  blurb: string;
  description: string;
  palette: [string, string];
  keywords: string[];
  proOnly: boolean;
}

export const STYLES: DesignStyle[] = [
  {
    id: "japandi",
    name: "Japandi",
    blurb: "Calm · Wood · Linen",
    description:
      "A fusion of Japanese minimalism and Scandinavian hygge. Warm woods, low furniture, muted textiles.",
    palette: ["#3a3631", "#1a1a1a"],
    keywords: ["wabi-sabi", "minimal", "natural", "warm"],
    proOnly: false,
  },
  {
    id: "industrial",
    name: "Industrial",
    blurb: "Steel · Brick · Edison",
    description:
      "Exposed brick, blackened steel, raw wood, and Edison bulbs for a loft-warehouse feel.",
    palette: ["#2b2b2e", "#0e0e10"],
    keywords: ["loft", "raw", "metal", "edison"],
    proOnly: false,
  },
  {
    id: "boho",
    name: "Boho",
    blurb: "Rattan · Warm · Eclectic",
    description:
      "Layered textiles, rattan, plants, and earthy colors for a relaxed, collected-over-time feel.",
    palette: ["#5a3a25", "#231510"],
    keywords: ["rattan", "plants", "eclectic", "earthy"],
    proOnly: false,
  },
  {
    id: "scandi",
    name: "Scandinavian",
    blurb: "Bright · Airy · Soft",
    description:
      "Bright whites, pale wood, soft wool, and unfussy silhouettes that maximize light.",
    palette: ["#4a5660", "#1a2129"],
    keywords: ["hygge", "light", "wool", "oak"],
    proOnly: false,
  },
  {
    id: "midcentury",
    name: "Mid-Century",
    blurb: "Walnut · Brass · Geometric",
    description:
      "1950s–60s silhouettes — walnut, brass accents, tapered legs, and optimistic geometry.",
    palette: ["#6b4a2a", "#2a1c10"],
    keywords: ["walnut", "brass", "geometric", "retro"],
    proOnly: false,
  },
  {
    id: "minimalist",
    name: "Minimalist",
    blurb: "Clean · Calm · Essential",
    description:
      "Crisp whites, single accent material, and only what's essential. Restraint as luxury.",
    palette: ["#dcdcdc", "#8a8a8a"],
    keywords: ["white", "essential", "calm", "clean"],
    proOnly: false,
  },
  {
    id: "artdeco",
    name: "Art Deco",
    blurb: "Velvet · Gold · Bold",
    description:
      "Geometric opulence — jewel tones, polished brass, velvet, and dramatic lighting.",
    palette: ["#2a1a35", "#0d0618"],
    keywords: ["gold", "velvet", "jewel-tone", "glam"],
    proOnly: true,
  },
  {
    id: "coastal",
    name: "Coastal",
    blurb: "Linen · Blue · Bright",
    description:
      "Airy whites, weathered wood, linen slipcovers, and soft blues inspired by the shore.",
    palette: ["#7faabf", "#1e3a4d"],
    keywords: ["beach", "linen", "driftwood", "blue"],
    proOnly: true,
  },
];
