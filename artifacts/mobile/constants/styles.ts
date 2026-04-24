/**
 * Curated dataset of furniture / interior design themes.
 *
 * Each entry mirrors the server's catalog at `/api/styles` (so the IDs match
 * what `/api/render` expects), but additionally bundles a hero photograph and
 * a list of representative furniture pieces so the UI can render rich preview
 * cards without an extra network round-trip.
 */
import type { ImageSourcePropType } from "react-native";

export interface FurnitureTheme {
  id: string;
  name: string;
  blurb: string;
  description: string;
  hero: ImageSourcePropType;
  palette: [string, string];
  furniture: string[];
  materials: string[];
  era: string;
  proOnly: boolean;
}

export const FURNITURE_THEMES: FurnitureTheme[] = [
  {
    id: "japandi",
    name: "Japandi",
    blurb: "Calm · Wood · Linen",
    description:
      "A fusion of Japanese minimalism and Scandinavian hygge. Warm woods, low furniture, muted textiles.",
    hero: require("../assets/styles/japandi.png"),
    palette: ["#3a3631", "#1a1a1a"],
    furniture: ["Low oak coffee table", "Linen platform sofa", "Paper lantern", "Tatami bench"],
    materials: ["Oak", "Linen", "Rice paper", "Stone"],
    era: "Contemporary",
    proOnly: false,
  },
  {
    id: "industrial",
    name: "Industrial",
    blurb: "Steel · Brick · Edison",
    description:
      "Exposed brick, blackened steel, raw wood, and Edison bulbs for a loft-warehouse feel.",
    hero: require("../assets/styles/industrial.png"),
    palette: ["#2b2b2e", "#0e0e10"],
    furniture: ["Leather chesterfield", "Steel pipe shelving", "Edison pendant", "Reclaimed wood table"],
    materials: ["Blackened steel", "Distressed leather", "Reclaimed oak", "Concrete"],
    era: "Post-industrial",
    proOnly: false,
  },
  {
    id: "boho",
    name: "Boho",
    blurb: "Rattan · Warm · Eclectic",
    description:
      "Layered textiles, rattan, plants, and earthy colors for a relaxed, collected-over-time feel.",
    hero: require("../assets/styles/boho.png"),
    palette: ["#5a3a25", "#231510"],
    furniture: ["Peacock rattan chair", "Floor cushions", "Macrame hanging", "Terracotta planters"],
    materials: ["Rattan", "Wool kilim", "Terracotta", "Brass"],
    era: "Eclectic 1970s",
    proOnly: false,
  },
  {
    id: "scandi",
    name: "Scandinavian",
    blurb: "Bright · Airy · Soft",
    description:
      "Bright whites, pale wood, soft wool, and unfussy silhouettes that maximize light.",
    hero: require("../assets/styles/scandi.png"),
    palette: ["#4a5660", "#1a2129"],
    furniture: ["Pale oak dining set", "Wool bouclé sofa", "Arc floor lamp", "Birch shelving"],
    materials: ["Pale oak", "Wool", "Linen", "Matte ceramic"],
    era: "Mid-century Nordic",
    proOnly: false,
  },
  {
    id: "midcentury",
    name: "Mid-Century",
    blurb: "Walnut · Brass · Geometric",
    description:
      "1950s–60s silhouettes — walnut, brass accents, tapered legs, and optimistic geometry.",
    hero: require("../assets/styles/midcentury.png"),
    palette: ["#6b4a2a", "#2a1c10"],
    furniture: ["Walnut credenza", "Velvet lounge chair", "Brass arc lamp", "Tapered-leg coffee table"],
    materials: ["Walnut", "Brass", "Velvet", "Smoked glass"],
    era: "1950s–1960s",
    proOnly: false,
  },
  {
    id: "minimalist",
    name: "Minimalist",
    blurb: "Clean · Calm · Essential",
    description:
      "Crisp whites, single accent material, and only what's essential. Restraint as luxury.",
    hero: require("../assets/styles/minimalist.png"),
    palette: ["#dcdcdc", "#8a8a8a"],
    furniture: ["Low slung white sofa", "Concrete coffee table", "Architectural floor lamp", "Single sculptural vase"],
    materials: ["Lime plaster", "Polished concrete", "Powder-coated steel", "White oak"],
    era: "Contemporary",
    proOnly: false,
  },
  {
    id: "artdeco",
    name: "Art Deco",
    blurb: "Velvet · Gold · Bold",
    description:
      "Geometric opulence — jewel tones, polished brass, velvet, and dramatic lighting.",
    hero: require("../assets/styles/artdeco.png"),
    palette: ["#2a1a35", "#0d0618"],
    furniture: ["Emerald velvet sofa", "Brass fan sconces", "Mirrored coffee table", "Fluted bar cabinet"],
    materials: ["Velvet", "Polished brass", "Marble", "Lacquered wood"],
    era: "1920s–1930s",
    proOnly: true,
  },
  {
    id: "coastal",
    name: "Coastal",
    blurb: "Linen · Blue · Bright",
    description:
      "Airy whites, weathered wood, linen slipcovers, and soft blues inspired by the shore.",
    hero: require("../assets/styles/coastal.png"),
    palette: ["#7faabf", "#1e3a4d"],
    furniture: ["Linen slipcover sofa", "Driftwood coffee table", "Rope pendant lamp", "Rattan accent chair"],
    materials: ["Linen", "Driftwood", "Jute", "Sea glass"],
    era: "Contemporary coastal",
    proOnly: true,
  },
];

export function getThemeById(id: string): FurnitureTheme | undefined {
  return FURNITURE_THEMES.find((t) => t.id === id);
}
