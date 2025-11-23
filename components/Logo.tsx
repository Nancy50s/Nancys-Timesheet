import React from 'react';

const Logo: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center w-full">
      <svg viewBox="0 0 500 420" className="w-full h-auto drop-shadow-md select-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="checkers" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
            <rect x="0" y="0" width="30" height="30" fill="#fef3c7" /> {/* Amber-100 */}
            <rect x="30" y="0" width="30" height="30" fill="#dc2626" /> {/* Red-600 */}
            <rect x="0" y="30" width="30" height="30" fill="#dc2626" />
            <rect x="30" y="30" width="30" height="30" fill="#fef3c7" />
          </pattern>
          <clipPath id="circleClip">
             <circle cx="250" cy="200" r="115" />
          </clipPath>
        </defs>

        {/* --- WINGS (Bottom Layer) --- */}
        <g transform="translate(250, 360)">
           {/* Left Wing */}
           <path d="M-20 0 L -220 -30 L -220 -10 L -180 0 L -210 10 L -160 20 L -200 30 L -140 40 L -20 40 Z" fill="#fbbf24" stroke="black" strokeWidth="2" />
           <path d="M-20 5 L -190 -20 L -160 -5 L -140 5 Z" fill="#fcd34d" opacity="0.5" />
           
           {/* Right Wing */}
           <path d="M20 0 L 220 -30 L 220 -10 L 180 0 L 210 10 L 160 20 L 200 30 L 140 40 L 20 40 Z" fill="#fbbf24" stroke="black" strokeWidth="2" />
           <path d="M20 5 L 190 -20 L 160 -5 L 140 5 Z" fill="#fcd34d" opacity="0.5" />
        </g>

        {/* --- FOOD ITEMS (Background Layer) --- */}
        
        {/* Left: Burger & Fries */}
        <g transform="translate(50, 230) scale(0.9)">
           {/* Fries */}
           <g transform="translate(-30, -40) rotate(-10)">
             <path d="M0 0 L 40 0 L 35 50 L 5 50 Z" fill="#ef4444" stroke="black" strokeWidth="2"/>
             <rect x="5" y="-30" width="8" height="40" fill="#facc15" stroke="black" strokeWidth="1" />
             <rect x="15" y="-40" width="8" height="50" fill="#facc15" stroke="black" strokeWidth="1" />
             <rect x="25" y="-35" width="8" height="45" fill="#facc15" stroke="black" strokeWidth="1" />
           </g>
           {/* Burger */}
           <g transform="translate(20, 0)">
             <path d="M0 20 Q 30 -10 60 20 Z" fill="#d97706" stroke="black" strokeWidth="2" /> {/* Top Bun */}
             <path d="M0 20 L 60 20 L 60 25 L 0 25 Z" fill="#166534" stroke="black" strokeWidth="1" /> {/* Lettuce */}
             <path d="M-2 25 L 62 25 L 62 35 L -2 35 Z" fill="#451a03" stroke="black" strokeWidth="1" /> {/* Patty */}
             <path d="M0 35 L 60 35 Q 30 50 0 35 Z" fill="#d97706" stroke="black" strokeWidth="2" /> {/* Bottom Bun */}
             {/* Cheese drip */}
             <path d="M10 25 L 50 25 L 55 30 L 40 25 Z" fill="#facc15" />
           </g>
        </g>

        {/* Right: Shake & Pancakes */}
        <g transform="translate(400, 200) scale(0.9)">
           {/* Milkshake */}
           <g transform="translate(-40, -20)">
             <path d="M10 10 L 20 80 L 50 80 L 60 10 Z" fill="#fbcfe8" stroke="black" strokeWidth="2" /> {/* Glass */}
             <path d="M10 10 Q 35 -20 60 10" fill="#fce7f3" stroke="black" strokeWidth="2" /> {/* Whipped Cream */}
             <line x1="55" y1="20" x2="55" y2="70" stroke="#be185d" strokeWidth="4" opacity="0.3" /> {/* Liquid detail */}
             <line x1="45" y1="0" x2="60" y2="-40" stroke="#ef4444" strokeWidth="4" /> {/* Straw */}
             <circle cx="35" cy="-5" r="6" fill="#ef4444" stroke="black" strokeWidth="1" /> {/* Cherry */}
           </g>
           {/* Pancakes */}
           <g transform="translate(20, 40)">
              <ellipse cx="30" cy="30" rx="40" ry="10" fill="#d97706" stroke="black" strokeWidth="2" />
              <ellipse cx="30" cy="25" rx="38" ry="9" fill="#fbbf24" stroke="black" strokeWidth="2" />
              <ellipse cx="30" cy="20" rx="36" ry="8" fill="#d97706" stroke="black" strokeWidth="2" />
              <path d="M20 15 Q 30 25 40 15" fill="#fff" opacity="0.8" /> {/* Butter/Syrup shine */}
           </g>
        </g>

        {/* --- MAIN BADGE --- */}
        {/* Outer Rim */}
        <circle cx="250" cy="200" r="125" fill="#fcd34d" stroke="black" strokeWidth="2" />
        {/* Inner Checkerboard */}
        <circle cx="250" cy="200" r="115" fill="url(#checkers)" stroke="black" strokeWidth="2" />

        {/* --- CHARACTER --- */}
        <g clipPath="url(#circleClip)">
            <g transform="translate(250, 240) scale(1.1)">
               {/* Hair Back */}
               <path d="M-50 -60 Q -80 -20 -60 50 L 60 50 Q 80 -20 50 -60" fill="#ef4444" />
               {/* Ponytail */}
               <path d="M-50 -60 Q -90 -40 -80 20 Q -60 40 -40 0" fill="#ef4444" stroke="black" strokeWidth="1"/>
               
               {/* Shirt */}
               <path d="M-60 60 L -60 20 Q 0 0 60 20 L 60 60 Z" fill="#ec4899" />
               <path d="M-50 20 L -20 20 L 0 50 L 20 20 L 50 20 L 30 60 L -30 60 Z" fill="white" stroke="black" strokeWidth="1" /> {/* Collar */}
               
               {/* Neck */}
               <rect x="-15" y="-10" width="30" height="40" fill="#ffedd5" />
               
               {/* Face Shape */}
               <path d="M-40 -50 L -40 -10 Q -40 30 0 30 Q 40 30 40 -10 L 40 -50 Z" fill="#ffedd5" stroke="black" strokeWidth="1" />
               
               {/* Hair Front / Bangs */}
               <path d="M-42 -50 Q -20 -20 0 -50 Q 20 -20 42 -50 Q 40 -80 0 -85 Q -40 -80 -42 -50" fill="#ef4444" stroke="black" strokeWidth="1" />
               
               {/* Features */}
               <path d="M-25 -20 Q -15 -25 -5 -20" fill="none" stroke="black" strokeWidth="1" /> {/* Eyebrow L */}
               <path d="M25 -20 Q 15 -25 5 -20" fill="none" stroke="black" strokeWidth="1" /> {/* Eyebrow R */}
               
               <circle cx="-12" cy="-12" r="3" fill="black" /> {/* Eye L */}
               <circle cx="12" cy="-12" r="3" fill="black" /> {/* Eye R */}
               
               <path d="M-2 0 L 2 0 L 0 5 Z" fill="black" opacity="0.2" /> {/* Nose shadow */}
               
               <path d="M-10 15 Q 0 22 10 15 Z" fill="#ef4444" stroke="black" strokeWidth="1" /> {/* Mouth */}
               
               {/* Bow */}
               <path d="M-30 -70 L -50 -80 L -30 -90 Z" fill="#60a5fa" stroke="black" strokeWidth="1" />
            </g>
        </g>
        
        {/* Inner Ring Highlight */}
        <circle cx="250" cy="200" r="115" fill="none" stroke="#fbbf24" strokeWidth="4" />


        {/* --- TEXT BANNER 1: Nancy May's --- */}
        <g transform="translate(250, 335)">
           {/* Red Ribbon Background */}
           <path d="M-140 -15 Q 0 15 140 -15 L 150 15 Q 0 45 -150 15 Z" fill="#dc2626" stroke="black" strokeWidth="2" />
           <text x="0" y="18" textAnchor="middle" fontFamily="'Courgette', cursive" fontSize="28" fill="white" style={{ textShadow: '1px 1px 0 #000' }}>
             Nancy May's 50's
           </text>
        </g>

        {/* --- TEXT BANNER 2: CAFE --- */}
        <g transform="translate(250, 370)">
           <path d="M-160 0 L 160 0 L 140 60 L -140 60 Z" fill="#dc2626" stroke="#fcd34d" strokeWidth="4" />
           <path d="M-160 0 L 160 0 L 140 60 L -140 60 Z" fill="none" stroke="black" strokeWidth="2" />
           <text x="0" y="48" textAnchor="middle" fontFamily="'Bungee Inline', cursive" fontSize="64" fill="white" stroke="black" strokeWidth="2" letterSpacing="2">
             CAFE
           </text>
        </g>

      </svg>
    </div>
  );
};

export default Logo;