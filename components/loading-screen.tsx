'use client';

import React, { useState, useEffect, useRef } from 'react';

const quotes = [
  {
    text: "There's always something we can do today, to improve our position tomorrow.",
    author: "Shane Parrish, Clear Thinking"
  },
  {
    text: "If you only read the books that everyone else is reading, you can only think what everyone else is thinking.",
    author: "Haruki Murakami, Norwegian Wood"
  },
  {
    text: "When we love, we always strive to become better than we are. When we strive to become better than we are, everything around us becomes better too.",
    author: "Paulo Coelho, The Alchemist"
  },
  {
    text: "It is only with the heart that one can see rightly; what is essential is invisible to the eye.",
    author: "Antoine de Saint-Exupéry, The Little Prince"
  },
  {
    text: "If you want to go fast, go alone. If you want to go far, go together.",
    author: "African Proverb"
  },
  {
    text: "The only way to do great work is to love what you do.",
    author: "Steve Jobs"
  },
  {
    text: "Excellence is never an accident. It is always the result of high intention, sincere effort, and intelligent execution; it represents the wise choice of many alternatives - choice, not chance, determines your destiny.",
    author: "Aristotle"
  },
  {
    text: "if you’re a copycat, you can never keep up. You’re always in a passive position. You never lead; you always follow.",
    author: "Jason Fried, Rework"
  }
];

// Store the quote in module scope to persist across component instances
let sessionQuote: typeof quotes[0] | null = null;

export default function LoadingScreen({ minDuration = 1200 }) {
  const [currentQuote, setCurrentQuote] = useState(
    sessionQuote || quotes[0]
  );
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const mountTime = useRef(Date.now());
  
  // Select quote only once per session
  useEffect(() => {
    if (!sessionQuote) {
      const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
      sessionQuote = randomQuote;
      setCurrentQuote(randomQuote);
    }
  }, []);
  
  // Handle minimum display duration
  useEffect(() => {
    const checkTiming = () => {
      const elapsed = Date.now() - mountTime.current;
      const remaining = Math.max(0, minDuration - elapsed);
      
      setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => {
          setIsVisible(false);
        }, 1200); // Match transition duration
      }, remaining);
    };
    
    // Start exit process after minimum duration
    checkTiming();
  }, [minDuration]);

  if (!isVisible) return null;

  return (
    <div 
      className={`
        fixed inset-0 z-50 flex items-center justify-center
        transition-opacity duration-500 ease-out
        ${isExiting ? 'opacity-0' : 'opacity-100'}
      `}
      role="status"
      aria-live="polite"
      aria-label="Loading content"
    >
      {/* Gradient background */}
      <div className={`absolute inset-0 bg-gradient-to-br from-neutral-50 via-white to-neutral-50 overflow-hidden transition-opacity duration-1000 ease-out ${isExiting ? 'opacity-0' : 'opacity-100'}`}>
        {/* Animated gradient orbs with GPU acceleration */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl animate-float will-change-transform" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200/20 rounded-full blur-3xl animate-float-reverse will-change-transform" />
        
        {/* Additional subtle background elements */}
        <div className="absolute top-1/4 left-1/4 w-60 h-60 bg-[#28aeb8]/30 rounded-full blur-2xl animate-pulse-slow animation-delay-1000" />
        <div className="absolute bottom-1/4 right-1/4 w-60 h-60 bg-[#dff6f7]/60 rounded-full blur-2xl animate-pulse-slow animation-delay-1000" />
      </div>
      
      {/* Quote container */}
      <div className="relative z-10 max-w-3xl mx-auto px-8 text-center animate-slide-up">
        {/* Loading dots */}
        <div className="flex justify-center mb-12 space-x-2" aria-hidden="true">
          <div className="w-2 h-2 bg-neutral-400 rounded-full animate-pulse-dot" />
          <div className="w-2 h-2 bg-neutral-400 rounded-full animate-pulse-dot animation-delay-200" />
          <div className="w-2 h-2 bg-neutral-400 rounded-full animate-pulse-dot animation-delay-400" />
        </div>
        
        {/* Quote */}
        <blockquote className="relative">
          {/* Opening quote mark */}
          <span className="absolute -top-8 -left-4 text-6xl text-neutral-200 font-serif select-none animate-fade-in animation-delay-400" aria-hidden="true">
            "
          </span>
          
          <p className="text-2xl md:text-3xl  text-neutral-700 leading-relaxed tracking-wide animate-fade-in animation-delay-400">
            {currentQuote.text}
          </p>
          
          {/* Author */}
          <footer className="mt-6 animate-fade-in animation-delay-600">
            <cite className="text-sm tracking-wide text-neutral-500 font-medium not-italic">
              — {currentQuote.author}
            </cite>
          </footer>
        </blockquote>
      </div>
    </div>
  );
}