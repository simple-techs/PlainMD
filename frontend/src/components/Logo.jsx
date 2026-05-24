import React from "react";

export const LogoMark = ({ size = 24, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect width="32" height="32" rx="8" fill="#5B4ED8" />
    <path
      d="M16 8l2.5 5.5L24 16l-5.5 2.5L16 24l-2.5-5.5L8 16l5.5-2.5L16 8z"
      fill="white"
      opacity="0.9"
    />
  </svg>
);

export const LogoLockup = ({ className = "" }) => (
  <div className={`flex items-center gap-2 ${className}`}>
    <span className="text-xl font-bold tracking-tight text-zinc-900">
      Plain<span className="text-brand-purple">MD</span>
    </span>
  </div>
);

export default LogoLockup;
