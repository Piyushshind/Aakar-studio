import { studio } from './studio';

// Website copy from spec 17.2–17.5, 17.7, 17.8 and 17.12, used as written.

/** A line where some words render in gold (spec 4.3). */
export interface HighlightedLine {
  text: string;
  highlight: string[];
}

// Spec 17.2
export const taglines = {
  primary: {
    text: 'Capturing Emotions, Creating Memories.',
    highlight: ['Emotions', 'Memories'],
  } satisfies HighlightedLine,
  babyBand: 'Tiny Fingers, Big Memories.',
  albums: 'Your Memories Today, Your Treasures Forever.',
  gallery: 'Every Picture Tells Your Story.',
  anywhere: "Wherever you celebrate, we'll be there.",
  footer: 'Little Moments. Lasting Memories.',
};

// Spec 17.3
export const hero = {
  headline: studio.name,
  tagline: {
    text: 'Capturing Emotions, Creating Memories',
    highlight: ['Emotions', 'Memories'],
  } satisfies HighlightedLine,
  subLine:
    'Newborn, baby, maternity, wedding and family photography in Jalgaon, in our studio, outdoors, or wherever you celebrate.',
  ctaWork: 'View Our Work',
  ctaWhatsapp: 'Book on WhatsApp',
  whatsappMessage: "Hi Aakar Digital Photo Studio, I'd like to book a photoshoot.",
};

export const marqueeWords = [
  'Newborn',
  'Baby & Kids',
  'Themed Shoots',
  'First Birthday',
  'Maternity',
  'Weddings',
  'Pre-Wedding',
  'Family',
  'Custom Albums',
];

// Spec 17.4
export const homeIntro =
  "Every moment tells a story. At Aakar Digital Photo Studio, we capture yours with creativity, care and professional craft. From a newborn's very first days to the rituals and celebrations of your wedding, we turn fleeting moments into photographs you'll treasure for a lifetime.";

// Spec 17.5. TBD: years in business. While null, the "For N years," clause is left out.
const yearsInBusiness: number | null = null;

export const aboutParagraphs = [
  `Aakar Digital Photo Studio is a photography studio in the heart of Jalgaon, led by ${studio.owner}. ${
    yearsInBusiness ? `For ${yearsInBusiness} years, we` : 'We'
  } have been photographing the moments families never want to forget: a newborn's first days, the glow of motherhood, a child's birthday, and the emotions of a wedding day.`,
  'Behind every shoot is a dedicated team of photographers, videographers and album designers. We shoot in our studio, outdoors, or wherever you need us, in Jalgaon and beyond.',
  'Every shoot ends the same way: with photographs and albums made just for you, to be kept, shared and relived for years to come.',
];

// Spec 17.7
export const babyTrustPoints = [
  "Your baby's comfort and safety come first; we follow the baby's pace.",
  'Warm, clean studio with soft, gentle lighting.',
  "Bring your baby's favourite outfits and wraps, and we'll take care of the rest.",
  'Parents stay with the baby throughout.',
];

export const babyBandCta = {
  label: "Plan Your Baby's Shoot",
  whatsappMessage: "Hi, I'd like to plan a baby photoshoot.",
};

// Spec 17.8 (no prices anywhere)
export const quoteBand = {
  headline: 'Every shoot is made for you.',
  copy: "Every family and every celebration is different, so we don't believe in one-size-fits-all packages. Tell us what you have in mind and we'll put together the right plan for you.",
  ctaWhatsapp: 'Get a quote on WhatsApp',
  ctaCall: 'Call us',
  whatsappMessage: "Hi, I'd like a quote for a photoshoot.",
};

// Spec 17.12
export const contactHeadline = "Let's capture your story.";

// Spec 17.13 (photo quality section, approved 2026-10-21).
export const qualityCopy = {
  title: 'Every detail, beautifully clear.',
  body: 'Look closer: the embroidery, the jewellery, the tiniest expressions. Every photograph is carefully lit, shot and edited so the details hold up, on screen and in print.',
};

// Gallery "Best of" strip label.
export const bestOfLabel = 'Best of the studio';

// Section headings and short lines that spec 17 doesn't cover. DRAFT: need the user's approval.
// Wording is drawn from spec 17 (17.5, 17.6, 17.9, 17.10); nothing here adds facts.
export const sectionTitles = {
  services: 'Shoots for every chapter.',
  process: 'From first message to finished album.',
  about: 'A studio in the heart of Jalgaon.',
  faq: 'Questions, answered.',
};

export const albumsNote =
  'Every album is designed from scratch around your photos, in the style, size and finish you choose.';

export const anywhereBand = {
  statement: taglines.anywhere,
  supporting: 'In our studio, outdoors, or at your venue, in Jalgaon and beyond.',
  places: ['In the studio', 'Outdoors', 'At your venue', 'Jalgaon & beyond'],
};

export const aboutOffer = [
  { title: 'Studio and outdoor', text: 'In our studio, outdoors, or at your venue.' },
  { title: 'Any age', text: 'Newborns, babies, children, couples and whole families.' },
  { title: 'Any delivery format', text: 'Pen drive, Google Drive, WhatsApp or a printed album.' },
  {
    title: 'Fully custom albums',
    text: 'Designed around your photos, in any style, size or finish.',
  },
];

export const faqFollowUp = {
  text: "Didn't find your answer?",
  cta: 'Ask us on WhatsApp',
  whatsappMessage: 'Hi, I have a question about a photoshoot.',
};
