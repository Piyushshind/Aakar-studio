/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 'true' hides photos without confirmed consent (spec 6). Launch builds must set it. */
  readonly VITE_ENFORCE_CONSENT?: 'true' | 'false';
  /** Web3Forms access key for the contact form (spec 5 item 17). Without it the form offers
   * WhatsApp instead of sending. */
  readonly VITE_WEB3FORMS_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
