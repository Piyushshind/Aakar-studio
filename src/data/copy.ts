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
  'Product',
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
