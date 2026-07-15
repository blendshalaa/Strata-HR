import React from 'react';

/**
 * Strata HR — Official Logo Components
 * Brand Identity System 2025
 *
 * GeometricS   — Swiss-grid geometric lettermark (S)
 * StrataLayers — Horizontal strata bars icon (primary app icon)
 */

export function GeometricS({ color = '#0C0C0C', size = 60, className = '' }) {
  const h = Math.round(size * (80 / 60));
  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 60 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Top bar */}
      <rect width="60" height="11" fill={color} />
      {/* Upper-right vertical */}
      <rect x="49" width="11" height="45" fill={color} />
      {/* Middle bar */}
      <rect y="34" width="60" height="11" fill={color} />
      {/* Lower-left vertical */}
      <rect y="34" width="11" height="46" fill={color} />
      {/* Bottom bar */}
      <rect y="69" width="60" height="11" fill={color} />
    </svg>
  );
}

export function StrataLayers({ color = '#0C0C0C', size = 60, className = '' }) {
  const h = Math.round(size * (58 / 60));
  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 60 58"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="60" height="10" fill={color} />
      <rect y="16" width="45" height="10" fill={color} />
      <rect y="32" width="53" height="10" fill={color} />
      <rect y="48" width="33" height="10" fill={color} />
    </svg>
  );
}

/**
 * Default export — StrataLayers icon
 * Used in Sidebar, Navbar, Login, mobile header.
 * Pass `color="#fff"` for dark backgrounds (sidebar).
 * The `className` prop controls sizing (e.g. "w-6 h-6").
 */
const Logo = ({ className = 'w-8 h-8', color = '#0C0C0C' }) => (
  <StrataLayers color={color} className={className} size={32} />
);

export default Logo;
