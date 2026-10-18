import { studio } from '@/data/studio';

/** `https://wa.me/<digits>?text=...` — every Enquire and Book button goes through this. */
export function whatsappLink(message?: string) {
  const base = `https://wa.me/${studio.whatsapp}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function telLink() {
  return `tel:${studio.phoneE164}`;
}

export function mailtoLink(subject?: string) {
  const base = `mailto:${studio.email}`;
  return subject ? `${base}?subject=${encodeURIComponent(subject)}` : base;
}
