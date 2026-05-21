import { useRef, useEffect, useState } from 'react';

export function MarqueeText() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState('://Welcome </To> ://Gnoseon [idn] ://Selamat_datang </Di> ://Gnoseon>');
  
  useEffect(() => {
    // Load marquee text from localStorage
    const savedText = localStorage.getItem('gnoseon_marquee_text');
    if (savedText) {
      setText(savedText);
    }
  }, []);
  
  useEffect(() => {
    // Inject CSS animation dynamically
    const style = document.createElement('style');
    style.textContent = `
      @keyframes marquee {
        0% { transform: translateX(0%); }
        100% { transform: translateX(-100%); }
      }
      
      .marquee-content {
        animation: marquee linear infinite;
        animation-duration: 20s;
        display: flex;
        white-space: nowrap;
        width: max-content;
      }
      
      .marquee-content:hover {
        animation-play-state: paused;
      }
      
      /* Hide marquee on mobile */
      @media (max-width: 640px) {
        .marquee-container {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  return (
    <div 
      ref={containerRef}
      className="marquee-container relative overflow-hidden flex items-center h-8 flex-1"
      style={{ 
        fontFamily: 'JetBrains Mono, Space Mono, Courier New, monospace',
        backgroundColor: 'transparent',
        border: 'none',
        boxShadow: 'none'
      }}
    >
      <div className="marquee-content">
        <span className="inline-block">
          {text.split('').map((char, index) => {
            let colorClass = 'text-gray-500';
            let isBold = false;
            
            if (char.match(/[a-zA-Z]/)) {
              colorClass = 'text-green-600';
              isBold = true;
            }
            else if (char === '<' || (char.match(/[a-zA-Z]/) && text[index-1] === '<')) {
              colorClass = 'text-purple-600';
              isBold = true;
            }
            else if (char === '>' || (char.match(/[a-zA-Z]/) && text[index+1] === '>')) {
              colorClass = 'text-purple-600';
              isBold = true;
            }
            else if (char === '[' || (char === 'i' || char === 'd' || char === 'n')) {
              colorClass = 'text-green-600';
              isBold = true;
            }
            else if (char === ']') {
              colorClass = 'text-green-600';
              isBold = true;
            }
            else if ([':', '/', '_'].includes(char)) {
              colorClass = 'text-gray-500';
            }
            
            return (
              <span 
                key={index}
                className={`${colorClass} ${isBold ? 'font-bold' : 'font-normal'} text-sm`}
              >
                {char}
              </span>
            );
          })}
        </span>
        {/* Duplikat text untuk continuous scroll */}
        <span className="inline-block ml-8">
          {text.split('').map((char, index) => {
            let colorClass = 'text-gray-500';
            let isBold = false;
            
            if (char.match(/[a-zA-Z]/)) {
              colorClass = 'text-green-600';
              isBold = true;
            }
            else if (char === '<' || (char.match(/[a-zA-Z]/) && text[index-1] === '<')) {
              colorClass = 'text-purple-600';
              isBold = true;
            }
            else if (char === '>' || (char.match(/[a-zA-Z]/) && text[index+1] === '>')) {
              colorClass = 'text-purple-600';
              isBold = true;
            }
            else if (char === '[' || (char === 'i' || char === 'd' || char === 'n')) {
              colorClass = 'text-green-600';
              isBold = true;
            }
            else if (char === ']') {
              colorClass = 'text-green-600';
              isBold = true;
            }
            else if ([':', '/', '_'].includes(char)) {
              colorClass = 'text-gray-500';
            }
            
            return (
              <span 
                key={`dup-${index}`}
                className={`${colorClass} ${isBold ? 'font-bold' : 'font-normal'} text-sm`}
              >
                {char}
              </span>
            );
          })}
        </span>
      </div>
    </div>
  );
}
