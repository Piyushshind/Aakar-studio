// Type declarations for vite-imagetools import queries (spec 7.2, stage 2).
// TypeScript allows a single wildcard per pattern, so these match on the query's last directive.

declare module '*as=picture' {
  const picture: import('vite-imagetools').Picture;
  export default picture;
}

declare module '*as=srcset' {
  const srcset: string;
  export default srcset;
}

declare module '*&imagetools' {
  const src: string;
  export default src;
}
