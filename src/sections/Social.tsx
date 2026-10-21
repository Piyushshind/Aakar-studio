import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { ResponsiveImage } from '@/components/ui/ResponsiveImage';
import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { socialPosts } from '@/data/social';
import { studio } from '@/data/studio';

/** Social grid (spec 5, item 16). Hidden until the Instagram profile and posts are provided. */
export function Social() {
  const instagram = studio.socials.find((s) => s.platform.toLowerCase() === 'instagram');
  if (!instagram || socialPosts.length === 0) return null;

  return (
    <Section id="social" aria-labelledby="social-title" className="social">
      <Container>
        <SectionHeading id="social-title" eyebrow="Instagram" title="Fresh from the studio." />
        <ul className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {socialPosts.map((post) => (
            <li key={post.url}>
              <a href={post.url} target="_blank" rel="noopener noreferrer" className="block">
                <ResponsiveImage
                  photo={post.photoId}
                  ratio="1 / 1"
                  sizes="(min-width: 1024px) 16vw, 50vw"
                />
              </a>
            </li>
          ))}
        </ul>
        <Button href={instagram.url} variant="secondary" className="mt-10">
          Follow us on Instagram
        </Button>
      </Container>
    </Section>
  );
}
