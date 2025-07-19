// components/AnimatedLogo.tsx
"use client";

import React from "react";

export default function AnimatedLogo() {
  return (
    <div className="flex justify-center items-center h-screen">
      <svg
        width="200"
        height="200"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="animate-spin-slow"
      >
        <defs>
          <linearGradient id="gradient" x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFA500" />
            <stop offset="33%" stopColor="#FF3D00" />
            <stop offset="66%" stopColor="#E10098" />
            <stop offset="100%" stopColor="#8E2DE2" />
          </linearGradient>
        </defs>
        <path
          d="M50 30 C150 -10, 150 210, 50 170
             M60 40 C140 0, 140 200, 60 160
             M70 50 C130 10, 130 190, 70 150"
          stroke="url(#gradient)"
          strokeWidth="15"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
