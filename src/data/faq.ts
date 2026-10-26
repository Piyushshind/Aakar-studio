import type { FaqItem } from '@/types/content';
import { studio } from './studio';

// Spec 17.10. Also rendered as FAQPage JSON-LD (Phase 9).
export const faq: FaqItem[] = [
  {
    question: 'How much does a photoshoot cost?',
    answer: `Every shoot is different, so we prepare a custom quote for you. Call or WhatsApp us on ${studio.phone}.`,
  },
  {
    question: 'Do you shoot outside Jalgaon?',
    answer: 'Yes. We travel wherever you want us, for weddings, events and outdoor shoots.',
  },
  {
    question: 'Do you do outdoor shoots?',
    answer: 'Yes. We shoot in our studio, outdoors, or at your venue.',
  },
  {
    question: 'Is there an age limit for baby and kids shoots?',
    answer: 'No. We photograph newborns, babies and children of any age.',
  },
  {
    question: 'What themes do you offer for kids?',
    answer:
      'Many, including Little Krishna, Little Farmer, Beach Baby, Traditional Florals, Kutchi Traditional, Teddy Time, Blue Skies, Pink Winter and First Birthday setups. Ask us about the latest themes.',
  },
  {
    question: 'What should I bring for a baby shoot?',
    answer:
      "Please bring your baby's outfits, wraps and any favourite toys. We have a few props and themed setups at the studio, and we take care of the lighting and photography.",
  },
  {
    question: 'How will I receive my photos?',
    answer: 'In whatever format you prefer: pen drive, Google Drive, WhatsApp, or a printed album.',
  },
  {
    question: 'How soon will I get my photos?',
    answer: 'We deliver as soon as possible after your shoot.',
  },
  {
    question: 'Can I customise my album?',
    answer: 'Yes. Every album is designed to your choice of style, size and finish.',
  },
  {
    question: 'Do you offer passport photos and printing?',
    answer: 'Yes. Visit the studio for passport and ID photos, photo printing and framing.',
  },
];
