import {
  Baby,
  BookOpen,
  Camera,
  Frame,
  Gem,
  Heart,
  HeartHandshake,
  IdCard,
  PartyPopper,
  Printer,
  Sparkles,
  Users,
  type LucideIcon,
  type LucideProps,
} from 'lucide-react';
import type { IconName } from '@/types/content';

// Only the icons the data uses (services, studio extras), imported by name so lucide stays
// tree-shaken. Add an entry here when a data file names a new icon.
const ICONS: Partial<Record<IconName, LucideIcon>> = {
  Baby,
  BookOpen,
  Frame,
  Gem,
  Heart,
  HeartHandshake,
  IdCard,
  PartyPopper,
  Printer,
  Sparkles,
  Users,
};

/** A lucide icon by its data name (e.g. a service's `icon`). Decorative by default. */
export function Icon({ name, ...props }: { name: IconName } & LucideProps) {
  const Component = ICONS[name];
  if (!Component && import.meta.env.DEV) console.warn(`Icon: "${name}" is not in the icon map`);
  const Resolved = Component ?? Camera;
  return <Resolved aria-hidden="true" {...props} />;
}
