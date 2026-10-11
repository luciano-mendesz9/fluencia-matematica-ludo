import type { ReactNode, SVGProps } from "react";

export type IconName =
  | "activity"
  | "arrow-left"
  | "book"
  | "building"
  | "chevron-down"
  | "clipboard"
  | "eye"
  | "eye-off"
  | "gauge"
  | "graduation-cap"
  | "grid"
  | "home"
  | "log-out"
  | "menu"
  | "play"
  | "people"
  | "school"
  | "settings"
  | "shield"
  | "sparkles"
  | "star"
  | "target"
  | "user"
  | "x";

const paths: Record<IconName, ReactNode> = {
  activity: <><path d="M3 12h4l2-7 4 14 2-7h6" /></>,
  "arrow-left": <><path d="m15 18-6-6 6-6" /></>,
  book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5Z" /><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5Z" /></>,
  building: <><path d="M3 21h18M6 21V7l6-4 6 4v14M9 10h.01M15 10h.01M9 14h.01M15 14h.01M10 21v-3h4v3" /></>,
  "chevron-down": <path d="m6 9 6 6 6-6" />,
  clipboard: <><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4.5V3h6v1.5M9 9h6M9 13h6M9 17h4" /></>,
  eye: <><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.5" /></>,
  "eye-off": <><path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.2A10.5 10.5 0 0 1 12 5c6 0 9.5 7 9.5 7a15 15 0 0 1-2 2.8M6.3 6.3C3.8 8 2.5 12 2.5 12s3.5 7 9.5 7a10 10 0 0 0 4-.8" /></>,
  gauge: <><path d="M4 18a8 8 0 1 1 16 0" /><path d="m12 14 3-3M8 18h8" /></>,
  "graduation-cap": <><path d="m2 10 10-5 10 5-10 5Z" /><path d="M6 12.5V17c3 2 9 2 12 0v-4.5M22 10v6" /></>,
  grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  home: <><path d="m3 11 9-8 9 8" /><path d="M5 10v11h14V10M9 21v-7h6v7" /></>,
  "log-out": <><path d="M10 17l5-5-5-5M15 12H3M15 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" /></>,
  menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
  play: <path d="m8 5 11 7-11 7Z" />,
  people: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" /></>,
  school: <><path d="m3 10 9-6 9 6M5 9v11h14V9M9 20v-6h6v6M8 11h.01M16 11h.01" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" /></>,
  shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></>,
  sparkles: <><path d="m12 3-1 3-3 1 3 1 1 3 1-3 3-1-3-1ZM5 14l-.7 2.3L2 17l2.3.7L5 20l.7-2.3L8 17l-2.3-.7ZM18 13l-.8 2.2L15 16l2.2.8L18 19l.8-2.2L21 16l-2.2-.8Z" /></>,
  star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9Z" />,
  target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  x: <><path d="M6 6l12 12M18 6 6 18" /></>,
};

export function Icon({ name, className = "size-5", ...props }: { name: IconName } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className} {...props}>
      {paths[name]}
    </svg>
  );
}
