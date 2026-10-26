// Theme labels for gallery filters and captions (spec 7.3). Key order is the filter-tab order.
export const themeLabels: Record<string, string> = {
  'traditional-flowers': 'Traditional Florals',
  'krishna-theme': 'Little Krishna',
  'kutchi-traditional': 'Kutchi Traditional',
  'farm-theme': 'Little Farmer',
  'beach-theme': 'Beach Baby',
  'teddy-theme': 'Teddy Time',
  'first-birthday': 'First Birthday',
  'blue-sky': 'Blue Skies',
  'pink-winter': 'Pink Winter',
  // 2026-10-23 photos (newborn, maternity, pre-wedding)
  studio: 'Studio',
  portrait: 'Portrait',
  outdoor: 'Outdoor',
  'ring-ceremony': 'Ring Ceremony',
  'floral-arch': 'Floral Arch',
};

/** Label for a theme id; unlisted ids (e.g. the album-only `wedding`) fall back to title case. */
export function themeLabel(theme: string) {
  return themeLabels[theme] ?? theme.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
