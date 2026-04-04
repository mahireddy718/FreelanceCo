"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

export const LayoutTextFlip = ({
  text = "Discover",
  words = [
    "Graphic Designers",
    "Web Developers",
    "Video Editors",
    "Videographers",
    "Photographers",
    "Content Writers",
    "Meme Creators"
  ],
  duration = 2500,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMouseIndicator, setShowMouseIndicator] = useState(true);
  const quickActions = [
    "Programming and Tech",
    "Graphics and Design",
    "Digital Marketing",
    "Writing and Translation",
    "Video and Animation",
    "AI Services",
    "Music and Audio",
    "Business",
    "Consulting",
    "Health and Fitness",
    "Education",
    "Legal"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % words.length);
    }, duration);

    return () => clearInterval(interval);
  }, []);

  // Scroll detection to hide/show mouse indicator
  useEffect(() => {
    const handleScroll = () => {
      // Show indicator when at the top (within 100px of top)
      // Hide when scrolled down
      setShowMouseIndicator(window.scrollY < 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-screen w-full -mt-10 relative px-4  ">
        <div className="flex flex-col md:flex-row items-center gap-3 md:gap-6 ">
          <motion.span
            layoutId="subtext"
            className="text-xl md:text-2xl lg:text-4xl font-bold tracking-tight drop-shadow-lg dark:text-white text-black">
            {text}
          </motion.span>
          <motion.span
            layout
            className="relative overflow-hidden rounded-md border border-emerald-200/80 bg-white/85 px-3 md:px-4 py-1.5 md:py-2 text-xl md:text-2xl lg:text-4xl font-bold tracking-tight text-emerald-700 shadow-lg shadow-emerald-500/15 ring-1 ring-emerald-100 drop-shadow-lg dark:border-emerald-400/30 dark:bg-emerald-950/60 dark:text-emerald-200 dark:ring-emerald-400/30">
            <AnimatePresence mode="popLayout">
              <motion.span
                key={currentIndex}
                initial={{ y: -40, filter: "blur(10px)" }}
                animate={{
                  y: 0,
                  filter: "blur(0px)",
                }}
                exit={{ y: 50, filter: "blur(10px)", opacity: 0 }}
                transition={{
                  duration: 0.5,
                }}
                className={cn("inline-block whitespace-nowrap")}>
                {words[currentIndex]}
              </motion.span>
            </AnimatePresence>
          </motion.span>
          <br /><br />
        </div>
        <p className="categories text-center font-normal text-slate-600 dark:text-slate-300 mt-6 md:mt-8 max-w-2xl text-sm md:text-base px-4 leading-relaxed">
          Find the perfect freelancer for your project. Browse our talented professionals and get your work done efficiently.
        </p>
        <br /><br />
        <div className="flex gap-2 md:gap-4 flex-wrap justify-center relative mt-6 md:mt-10 max-w-5xl">
          {quickActions.map((action) => (
            <button
              key={action}
              className="lift-chip cursor-pointer px-3 md:px-5 py-1 md:py-1.5 text-xs md:text-sm text-slate-700 dark:text-slate-200 font-normal rounded-full border border-slate-200/80 dark:border-slate-600/70 bg-white/70 dark:bg-slate-900/65 hover:bg-emerald-200/45 dark:hover:bg-emerald-600/20 hover:text-black dark:hover:text-white hover:border-emerald-400/70 dark:hover:border-emerald-500 transition-all duration-300"
            >
              {action}
            </button>
          ))}
        </div>

        {/* Scroll Down Indicator */}
        <AnimatePresence>
          {showMouseIndicator && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{
                opacity: 1,
                y: [0, 8, 0],
              }}
              exit={{ opacity: 0 }}
              transition={{
                opacity: { duration: 0.3 },
                y: {
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }
              }}
              className="absolute bottom-16 left-1/2 transform -translate-x-1/2"
            >
              <svg
                width="18"
                height="32"
                viewBox="0 0 18 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="opacity-50"
              >
                {/* Mouse body */}
                <rect
                  x="1"
                  y="1"
                  width="16"
                  height="30"
                  rx="8"
                  stroke="#4b5563"
                  strokeWidth="1.5"
                  fill="none"
                />
                {/* Scroll wheel */}
                <motion.g
                  animate={{
                    y: [0, 3],
                    opacity: [1, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <line
                    x1="9"
                    y1="8"
                    x2="9"
                    y2="14"
                    stroke="#4b5563"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </motion.g>
              </svg>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

    </>
  );
};
