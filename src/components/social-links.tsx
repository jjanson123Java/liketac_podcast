import type { SocialLink } from "@/config/social-links";

function isSafeSocialUrl(value: string) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export function SocialLinks({ links }: Readonly<{ links: SocialLink[] }>) {
  const configuredLinks = links.filter(
    ({ label, url }) => label.trim().length > 0 && isSafeSocialUrl(url.trim()),
  );

  if (configuredLinks.length === 0) return null;

  return (
    <nav className="socialLinks" aria-label="Social media">
      {configuredLinks.map(({ service, label, url }) => (
        <a key={service} href={url} target="_blank" rel="noopener noreferrer">
          <span>{service}:</span> {label}
        </a>
      ))}
    </nav>
  );
}
