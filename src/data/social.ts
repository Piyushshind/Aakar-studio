// Recent Instagram posts for the social grid (spec 5, item 16): locally saved photos (manifest
// ids) linking to the post. The grid hides until the profile and posts are provided (spec 18.1).
export interface SocialPost {
  photoId: string;
  url: string;
}

export const socialPosts: SocialPost[] = [];
