/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 'true' hides photos without confirmed consent (spec 6). Launch builds must set it. */
  readonly VITE_ENFORCE_CONSENT?: 'true' | 'false';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
