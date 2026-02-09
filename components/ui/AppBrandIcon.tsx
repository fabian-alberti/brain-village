import React from 'react';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

/**
 * Renders real vector brand icons for apps and categories.
 * Zero emojis — everything uses MaterialCommunityIcons or FontAwesome5.
 */

type IconDef =
  | { set: 'mci'; name: string; color: string }
  | { set: 'fa5'; name: string; color: string };

// ── App Icons ──────────────────────────────────────────────────────

const APP_ICON_MAP: Record<string, IconDef> = {
  // Social Media
  'Instagram':    { set: 'mci', name: 'instagram', color: '#E4405F' },
  'TikTok':       { set: 'fa5', name: 'tiktok', color: '#010101' },
  'Twitter/X':    { set: 'mci', name: 'twitter', color: '#1DA1F2' },
  'Facebook':     { set: 'mci', name: 'facebook', color: '#1877F2' },
  'Snapchat':     { set: 'mci', name: 'snapchat', color: '#FFFC00' },
  'LinkedIn':     { set: 'mci', name: 'linkedin', color: '#0A66C2' },
  'Pinterest':    { set: 'mci', name: 'pinterest', color: '#E60023' },
  'Reddit':       { set: 'mci', name: 'reddit', color: '#FF4500' },
  'Threads':      { set: 'mci', name: 'at', color: '#000000' },
  'BeReal':       { set: 'mci', name: 'camera', color: '#1A1A1A' },

  // Games
  'Roblox':         { set: 'mci', name: 'cube-outline', color: '#E2231A' },
  'Minecraft':      { set: 'mci', name: 'minecraft', color: '#62B47A' },
  'Candy Crush':    { set: 'mci', name: 'candy', color: '#F7941D' },
  'Clash Royale':   { set: 'mci', name: 'crown', color: '#F5C518' },
  'Among Us':       { set: 'mci', name: 'rocket-launch', color: '#C51111' },
  'Brawl Stars':    { set: 'mci', name: 'star-shooting', color: '#F7C948' },
  'Genshin Impact': { set: 'mci', name: 'sword-cross', color: '#5B8EC9' },
  'PUBG Mobile':    { set: 'mci', name: 'crosshairs-gps', color: '#F2A900' },

  // Entertainment
  'YouTube':      { set: 'mci', name: 'youtube', color: '#FF0000' },
  'Netflix':      { set: 'mci', name: 'netflix', color: '#E50914' },
  'Twitch':       { set: 'mci', name: 'twitch', color: '#9146FF' },
  'Disney+':      { set: 'mci', name: 'castle', color: '#113CCF' },
  'Spotify':      { set: 'mci', name: 'spotify', color: '#1DB954' },
  'Apple Music':  { set: 'mci', name: 'music', color: '#FC3C44' },
  'Prime Video':  { set: 'mci', name: 'video-box', color: '#00A8E1' },
  'HBO Max':      { set: 'mci', name: 'drama-masks', color: '#B632F0' },

  // Education
  'Duolingo':       { set: 'mci', name: 'owl', color: '#58CC02' },
  'Khan Academy':   { set: 'mci', name: 'brain', color: '#14BF96' },
  'Coursera':       { set: 'mci', name: 'book-open-page-variant', color: '#0056D2' },
  'Quizlet':        { set: 'mci', name: 'clipboard-text', color: '#4255FF' },
  'Notion':         { set: 'mci', name: 'creation', color: '#000000' },
  'Anki':           { set: 'mci', name: 'cards', color: '#236EC4' },

  // Utilities
  'Safari':     { set: 'mci', name: 'apple-safari', color: '#006CFF' },
  'Chrome':     { set: 'mci', name: 'google-chrome', color: '#4285F4' },
  'Mail':       { set: 'mci', name: 'email', color: '#1A73E8' },
  'Maps':       { set: 'mci', name: 'map-marker', color: '#34A853' },
  'Files':      { set: 'mci', name: 'file-multiple', color: '#1A73E8' },
  'Calendar':   { set: 'mci', name: 'calendar', color: '#E67C73' },

  // Health & Fitness
  'Strava':         { set: 'mci', name: 'run', color: '#FC4C02' },
  'MyFitnessPal':   { set: 'mci', name: 'food-apple', color: '#0070E0' },
  'Headspace':      { set: 'mci', name: 'meditation', color: '#F47D31' },
  'Calm':           { set: 'mci', name: 'wave', color: '#4F8FF7' },
  'Nike Run Club':  { set: 'mci', name: 'shoe-sneaker', color: '#1A1A1A' },
  'Health':         { set: 'mci', name: 'heart-pulse', color: '#FF2D55' },

  // News & Reading
  'Apple News':   { set: 'mci', name: 'newspaper', color: '#F44336' },
  'Flipboard':    { set: 'mci', name: 'bookmark', color: '#E12828' },
  'Kindle':       { set: 'mci', name: 'book-open-page-variant', color: '#FF9900' },
  'Medium':       { set: 'mci', name: 'feather', color: '#000000' },
  'Pocket':       { set: 'mci', name: 'bookmark', color: '#EF4056' },
  'Feedly':       { set: 'mci', name: 'satellite-uplink', color: '#2BB24C' },

  // Messaging
  'WhatsApp':   { set: 'mci', name: 'whatsapp', color: '#25D366' },
  'Telegram':   { set: 'fa5', name: 'telegram-plane', color: '#26A5E4' },
  'iMessage':   { set: 'mci', name: 'message-text', color: '#34C759' },
  'Discord':    { set: 'fa5', name: 'discord', color: '#5865F2' },
  'Signal':     { set: 'mci', name: 'lock-outline', color: '#3A76F0' },
  'Messenger':  { set: 'mci', name: 'facebook-messenger', color: '#0084FF' },
};

// ── Category Icons ─────────────────────────────────────────────────

const CATEGORY_ICON_MAP: Record<string, IconDef> = {
  'social':        { set: 'mci', name: 'account-group', color: '#1877F2' },
  'games':         { set: 'mci', name: 'gamepad-variant', color: '#9146FF' },
  'entertainment': { set: 'mci', name: 'movie-open', color: '#E50914' },
  'education':     { set: 'mci', name: 'school', color: '#0056D2' },
  'utilities':     { set: 'mci', name: 'wrench', color: '#5F6368' },
  'health':        { set: 'mci', name: 'heart-pulse', color: '#FF2D55' },
  'news':          { set: 'mci', name: 'newspaper-variant-outline', color: '#F44336' },
  'messaging':     { set: 'mci', name: 'message-text', color: '#25D366' },
};

// ── Render helper ──────────────────────────────────────────────────

function renderIcon(def: IconDef, size: number) {
  if (def.set === 'mci') {
    return (
      <MaterialCommunityIcons
        name={def.name as any}
        size={size}
        color={def.color}
      />
    );
  }

  return (
    <FontAwesome5
      name={def.name as any}
      size={size * 0.85}
      color={def.color}
    />
  );
}

// ── Public Components ──────────────────────────────────────────────

interface AppBrandIconProps {
  appName: string;
  size?: number;
}

/**
 * Renders a vector brand icon for an individual app.
 * Falls back to a generic phone icon (no emojis).
 */
export default function AppBrandIcon({ appName, size = 22 }: AppBrandIconProps) {
  const def = APP_ICON_MAP[appName];

  if (!def) {
    return (
      <MaterialCommunityIcons name="cellphone" size={size} color="#888" />
    );
  }

  return renderIcon(def, size);
}

interface CategoryIconProps {
  categoryId: string;
  size?: number;
  color?: string;
}

/**
 * Renders a vector icon for a category (Social Media, Games, etc.).
 * Falls back to a grid icon.
 */
export function CategoryIcon({ categoryId, size = 22, color }: CategoryIconProps) {
  const def = CATEGORY_ICON_MAP[categoryId];

  if (!def) {
    return (
      <MaterialCommunityIcons name="view-grid" size={size} color={color || '#888'} />
    );
  }

  if (color) {
    return (
      <MaterialCommunityIcons
        name={def.name as any}
        size={size}
        color={color}
      />
    );
  }

  return renderIcon(def, size);
}

/**
 * Returns the brand color for a given app, or a default gray.
 */
export function getAppBrandColor(appName: string): string {
  const def = APP_ICON_MAP[appName];
  return def ? def.color : '#888';
}
