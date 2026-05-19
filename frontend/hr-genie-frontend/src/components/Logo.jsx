import React from 'react';

const Logo = ({ className = "w-10 h-10" }) => (
  <svg className={className} viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
    {/* Background rounded square */}
    <rect width="40" height="40" rx="10" fill="#5B4FE8"/>
    {/* Lamp body top */}
    <path d="M20 9 C20 9 14 9 12 13 C10 17 13 19 13 19 L27 19 C27 19 30 17 28 13 C26 9 20 9 20 9Z" fill="#ffffff"/>
    {/* Lamp body bottom */}
    <path d="M13 19 L10 25 L30 25 L27 19Z" fill="#ffffff"/>
    {/* Lamp base curve */}
    <path d="M10 25 Q20 31 30 25" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round"/>
    {/* Lamp spout */}
    <path d="M28 13 Q34 11 33 7 Q32 4 29 6" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export default Logo;
