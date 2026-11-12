export type SocialLink = {
  service: "YouTube" | "Twitch" | "X / Twitter" | "Instagram" | "Discord";
  label: string;
  url: string;
};

// Add only accounts that the site owner has confirmed. Blank entries are not rendered.
// Like TAC intentionally has no social accounts configured yet.
export const socialLinks: SocialLink[] = [];
