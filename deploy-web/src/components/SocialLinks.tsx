import { Instagram, Facebook, Music2, Twitter, Youtube } from 'lucide-react';

interface SocialLinksProps {
  instagram_url?: string;
  facebook_url?: string;
  tiktok_url?: string;
  twitter_url?: string;
  youtube_url?: string;
  className?: string;
}

const SOCIAL_CONFIG = [
  { key: 'instagram_url', Icon: Instagram, label: 'Instagram', color: '#E4405F' },
  { key: 'facebook_url', Icon: Facebook, label: 'Facebook', color: '#1877F2' },
  { key: 'tiktok_url', Icon: Music2, label: 'TikTok', color: '#000000' },
  { key: 'twitter_url', Icon: Twitter, label: 'Twitter', color: '#1DA1F2' },
  { key: 'youtube_url', Icon: Youtube, label: 'YouTube', color: '#FF0000' },
] as const;

export function SocialLinks({ instagram_url, facebook_url, tiktok_url, twitter_url, youtube_url, className = '' }: SocialLinksProps) {
  const urls: Record<string, string | undefined> = {
    instagram_url,
    facebook_url,
    tiktok_url,
    twitter_url,
    youtube_url,
  };

  const links = SOCIAL_CONFIG.filter(s => urls[s.key]);

  if (links.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      {links.map(social => {
        const Icon = social.Icon;
        return (
          <a
            key={social.key}
            href={urls[social.key]}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 w-10 items-center justify-center rounded-full text-white transition-all hover:scale-110"
            style={{ background: social.color }}
            aria-label={social.label}
            title={social.label}
          >
            <Icon className="h-[18px] w-[18px]" />
          </a>
        );
      })}
    </div>
  );
}
