// Header and footer navigation (spec 5, item 2). Ids are the section ids on the page.
export const navItems = [
  { id: 'work', label: 'Work' },
  { id: 'services', label: 'Services' },
  { id: 'albums', label: 'Albums' },
  { id: 'about', label: 'About' },
  { id: 'faq', label: 'FAQ' },
  { id: 'contact', label: 'Contact' },
] as const;

export type SectionId =
  | (typeof navItems)[number]['id']
  | 'top'
  | 'quality'
  | 'little-ones'
  | 'anywhere'
  | 'quote'
  | 'process';

/** Numbered eyebrows ("01 — See the difference"); stable even when optional sections hide. */
export const sectionEyebrows = {
  quality: { number: '01', label: 'See the difference' },
  work: { number: '02', label: 'Our work' },
  littleOnes: { number: '03', label: 'Babies & little ones' },
  albums: { number: '04', label: 'Custom albums' },
  services: { number: '05', label: 'Services' },
  process: { number: '06', label: 'How it works' },
  about: { number: '07', label: 'About us' },
  faq: { number: '08', label: 'Questions' },
  contact: { number: '09', label: 'Contact' },
} as const;
