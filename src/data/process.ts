import type { ProcessStep } from '@/types/content';

// Spec 17.9.
export const processSteps: ProcessStep[] = [
  { title: 'Get in touch', description: 'Call or WhatsApp us with your date and idea.' },
  {
    title: 'Plan together',
    description: 'We discuss the shoot, theme, location and style you want.',
  },
  { title: 'Shoot day', description: 'In our studio, outdoors, or at your venue.' },
  { title: 'Editing', description: 'Our team carefully selects and edits your best moments.' },
  {
    title: 'Delivery',
    description:
      'As soon as possible, in the format you choose: pen drive, Google Drive, WhatsApp, or a custom printed album.',
  },
];
