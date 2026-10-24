import type { Service, StudioExtra } from '@/types/content';

// Spec 17.6. `imageId` only where a real studio photo fits; the rest are icon cards.
export const services: Service[] = [
  {
    id: 'newborn',
    title: 'Newborn Photoshoot',
    icon: 'Baby',
    imageId: 'newborn-studio-01',
    description:
      "Your baby's first days, beautifully preserved. Gentle poses, soft lighting and carefully styled setups, always at your baby's pace and with their comfort first.",
    whatsappMessage: "Hi Aakar Digital Photo Studio, I'd like to know about a Newborn Photoshoot.",
  },
  {
    id: 'baby-kids',
    title: 'Baby & Kids Themed Shoots',
    icon: 'Sparkles',
    imageId: 'baby-kids-kutchi-traditional-06',
    description:
      "Little Krishna, Little Farmer, Beach Baby and more: playful themed sets for babies and children of any age, in our studio or outdoors. Bring their favourite outfits and we'll create the magic.",
    whatsappMessage: "Hi, I'd like to know about a Baby and Kids Themed Photoshoot.",
  },
  {
    id: 'maternity',
    title: 'Maternity Photoshoot',
    icon: 'Heart',
    imageId: 'maternity-portrait-01',
    description:
      'Celebrate the journey to motherhood with elegant portraits, graceful poses and personalised concepts that preserve this beautiful chapter.',
    whatsappMessage: "Hi, I'd like to know about a Maternity Photoshoot.",
  },
  {
    id: 'wedding',
    title: 'Wedding Photography',
    icon: 'Gem',
    imageId: 'wedding-01-04',
    description:
      'From haldi to vidaai, we capture the rituals, candid emotions, couple portraits and family moments that make your day unforgettable, wherever you celebrate.',
    whatsappMessage: "Hi, I'd like to know about Wedding Photography.",
  },
  {
    id: 'pre-wedding',
    title: 'Pre-Wedding & Engagement',
    icon: 'HeartHandshake',
    imageId: 'pre-wedding-outdoor-03',
    description:
      'Tell your love story before the big day, with relaxed couple portraits at the locations you love.',
    whatsappMessage: "Hi, I'd like to know about a Pre-Wedding Shoot.",
  },
  {
    id: 'family',
    title: 'Family & Sibling Portraits',
    icon: 'Users',
    imageId: 'family-studio-01',
    description:
      'Real smiles and loving connections, with natural, coordinated portraits of parents, siblings and the whole family.',
    whatsappMessage: "Hi, I'd like to know about a Family Photoshoot.",
  },
  {
    id: 'birthdays',
    title: 'Birthdays & Ceremonies',
    icon: 'PartyPopper',
    imageId: 'baby-kids-first-birthday-01',
    description:
      'First birthdays, half birthdays, naming ceremonies and family functions, captured with every smile and every detail.',
    whatsappMessage: "Hi, I'd like to know about photography for a birthday or ceremony.",
  },
  {
    id: 'albums',
    title: 'Custom Photo Albums',
    icon: 'BookOpen',
    imageId: 'little-farmer-01',
    description:
      'Albums designed entirely around your photos and your taste, in any style, size or finish you like.',
    whatsappMessage: "Hi, I'd like to know about Custom Photo Albums.",
  },
];

/** "Also at the studio" row under the service cards. */
export const studioExtras: StudioExtra[] = [
  { title: 'Passport & ID Photos', icon: 'IdCard' },
  { title: 'Photo Printing', icon: 'Printer' },
  { title: 'Photo Framing', icon: 'Frame' },
];

export const studioExtrasWhatsappMessage =
  "Hi, I'd like to know about passport photos, printing or framing.";
