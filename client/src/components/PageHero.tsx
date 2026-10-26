import React from 'react';

interface PageHeroProps {
  image: string;
  imageAlt: string;
  title: string;
  description: string;
  /** CSS object-position for the photo crop, e.g. 'center 40%'. */
  focus?: string;
  /** Optional controls shown on the right (buttons, inspectors). */
  actions?: React.ReactNode;
}

/**
 * Photo banner used at the top of each role's main pages.
 * The photo sits behind a dark leaf-green fade so the title stays readable.
 */
export const PageHero: React.FC<PageHeroProps> = ({ image, imageAlt, title, description, focus = 'center', actions }) => (
  <header className="relative overflow-hidden rounded-lg bg-brand-deep min-h-[168px] flex items-end">
    <img
      src={image}
      alt={imageAlt}
      className="absolute inset-0 w-full h-full object-cover"
      style={{ objectPosition: focus }}
      loading="eager"
    />
    <div className="absolute inset-0 bg-gradient-to-r from-[#0B1F15]/90 via-[#0B1F15]/65 to-[#0B1F15]/10" />
    <div className="relative w-full p-5 sm:p-7 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
      <div className="max-w-2xl">
        <h1 className="text-[clamp(1.6rem,2.6vw,2.25rem)] leading-tight text-white">{title}</h1>
        <p className="mt-1.5 text-[15px] text-white/80 max-w-xl">{description}</p>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  </header>
);
