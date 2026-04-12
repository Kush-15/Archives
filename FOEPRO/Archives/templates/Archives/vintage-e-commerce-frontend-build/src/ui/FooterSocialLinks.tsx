import type { CSSProperties } from 'react';
import { X as XIcon, createLucideIcon } from 'lucide-react';

const DiscordIcon = createLucideIcon('discord', [
  ['path', { d: 'M8 12a1 1 0 1 0 2 0a1 1 0 0 0 -2 0' }],
  ['path', { d: 'M14 12a1 1 0 1 0 2 0a1 1 0 0 0 -2 0' }],
  ['path', { d: 'M15.5 17c0 1 1.5 3 2 3c1.5 0 2.833 -1.667 3.5 -3c.667 -1.667 .5 -5.833 -1.5 -11.5c-1.457 -1.015 -3 -1.34 -4.5 -1.5l-.972 1.923a11.913 11.913 0 0 0 -4.053 0l-.975 -1.923c-1.5 .16 -3.043 .485 -4.5 1.5c-2 5.667 -2.167 9.833 -1.5 11.5c.667 1.333 2 3 3.5 3c.5 0 2 -2 2 -3' }],
  ['path', { d: 'M7 16.5c3.5 1 6.5 1 10 0' }],
]);

const InstagramIcon = createLucideIcon('instagram', [
  ['path', { d: 'M4 8a4 4 0 0 1 4 -4h8a4 4 0 0 1 4 4v8a4 4 0 0 1 -4 4h-8a4 4 0 0 1 -4 -4l0 -8' }],
  ['path', { d: 'M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0' }],
  ['path', { d: 'M16.5 7.5v.01' }],
]);

const LinkedinIcon = createLucideIcon('linkedin', [
  ['path', { d: 'M8 11v5' }],
  ['path', { d: 'M8 8v.01' }],
  ['path', { d: 'M12 16v-5' }],
  ['path', { d: 'M16 16v-3a2 2 0 1 0 -4 0' }],
  ['path', { d: 'M3 7a4 4 0 0 1 4 -4h10a4 4 0 0 1 4 4v10a4 4 0 0 1 -4 4h-10a4 4 0 0 1 -4 -4l0 -10' }],
]);

interface FooterSocialLinksProps {
  justifyContent?: CSSProperties['justifyContent'];
}

const iconBaseStyle: CSSProperties = {
  color: 'inherit',
  width: '1.85rem',
  height: '1.85rem',
  borderRadius: '999px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const activeIconStyle: CSSProperties = {
  ...iconBaseStyle,
  border: '1px solid rgba(248, 247, 244, 0.35)',
};

const placeholderIconStyle: CSSProperties = {
  ...iconBaseStyle,
  border: '1px solid rgba(248, 247, 244, 0.2)',
  opacity: 0.6,
};

export function FooterSocialLinks({ justifyContent = 'center' }: FooterSocialLinksProps = {}) {
  return (
    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', justifyContent }}>
      <a
        href="https://discord.gg/p89YbDMWZ"
        target="_blank"
        rel="noreferrer"
        aria-label="Discord"
        style={activeIconStyle}
      >
        <DiscordIcon size={14} strokeWidth={1.8} />
      </a>
      <a
        href="https://ig.me/j/AbaYv6JEmEqmzJsm/"
        target="_blank"
        rel="noreferrer"
        aria-label="Instagram"
        style={activeIconStyle}
      >
        <InstagramIcon size={14} strokeWidth={1.8} />
      </a>
      <span aria-label="LinkedIn placeholder" title="LinkedIn" style={placeholderIconStyle}>
        <LinkedinIcon size={14} strokeWidth={1.8} />
      </span>
      <span aria-label="X placeholder" title="X" style={placeholderIconStyle}>
        <XIcon size={14} strokeWidth={1.8} />
      </span>
    </div>
  );
}
