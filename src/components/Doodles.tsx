import React from "react";
import { motion } from "motion/react";

export function Doodles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Background Dot Grid */}
      <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at center, #cbd5e1 1px, transparent 1px)', backgroundSize: '24px 24px', opacity: 0.3 }}></div>
      
      {/* Doodle 1: Squiggle */}
      <motion.svg 
        initial={{ opacity: 0, pathLength: 0 }}
        animate={{ opacity: 0.6, pathLength: 1 }}
        transition={{ duration: 2, ease: "easeInOut" }}
        className="absolute top-16 left-8 sm:top-32 sm:left-10 w-24 h-24 text-indigo-400 transform -rotate-12 drop-shadow-sm" 
        viewBox="0 0 100 100" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="4" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <path d="M10,50 Q25,20 40,50 T70,50 T100,50" />
      </motion.svg>

      {/* Doodle 2: Paper Plane */}
      <motion.svg 
        initial={{ opacity: 0, scale: 0, x: -20, y: 20 }}
        animate={{ opacity: 0.6, scale: 1, x: 0, y: 0, rotate: [-5, 5, -5] }}
        transition={{ duration: 1, delay: 0.5, rotate: { repeat: Infinity, duration: 3, ease: "easeInOut" } }}
        className="absolute top-48 right-8 sm:right-20 w-12 h-12 text-blue-400 drop-shadow-sm" 
        viewBox="0 0 24 24" 
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="22" y1="2" x2="11" y2="13"></line>
        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
      </motion.svg>

      {/* Doodle 3: Arrow */}
      <motion.svg 
        initial={{ opacity: 0, x: -20, y: 20 }}
        animate={{ opacity: 0.7, x: 0, y: 0 }}
        transition={{ duration: 1.5, delay: 1 }}
        className="absolute top-[40%] left-4 sm:left-32 w-12 h-12 sm:w-16 sm:h-16 text-emerald-400 transform rotate-45 drop-shadow-sm" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="3.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <line x1="5" y1="12" x2="19" y2="12"></line>
        <polyline points="12 5 19 12 12 19"></polyline>
      </motion.svg>

      {/* Doodle 4: Bulb/Circle */}
      <motion.svg 
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 0.5, scale: 1 }}
        transition={{ duration: 1.2, delay: 1.5 }}
        className="absolute bottom-[30%] right-10 sm:right-32 w-20 h-20 text-sky-400"
        viewBox="0 0 100 100" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="3.5" 
        strokeDasharray="8 8"
      >
        <circle cx="50" cy="50" r="40" />
      </motion.svg>

      {/* Doodle 5: Sparkles */}
      <motion.svg 
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="absolute top-16 right-[20%] sm:right-[30%] w-8 h-8 sm:w-12 sm:h-12 text-amber-400"
        viewBox="0 0 24 24" 
        fill="currentColor"
      >
        <path d="M12 2L13.4 8.6L20 10L13.4 11.4L12 18L10.6 11.4L4 10L10.6 8.6L12 2Z" />
      </motion.svg>
      
      {/* Doodle 6: Cloud */}
      <motion.svg 
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 0.5, x: 0, y: [-5, 5, -5] }}
        transition={{ opacity: {duration: 1.5, delay: 0.8}, y: { repeat: Infinity, duration: 4, ease: "easeInOut" } }}
        className="absolute bottom-16 left-[20%] w-16 h-16 sm:w-24 sm:h-24 text-rose-300"
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
      </motion.svg>
      
      {/* Doodle 7: Star */}
      <motion.svg 
        initial={{ opacity: 0, scale: 0, rotate: -45 }}
        animate={{ opacity: 0.6, scale: 1, rotate: 0 }}
        transition={{ duration: 1.5, delay: 1.2 }}
        className="absolute bottom-40 right-[40%] w-10 h-10 text-violet-400"
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </motion.svg>
    </div>
  );
}
