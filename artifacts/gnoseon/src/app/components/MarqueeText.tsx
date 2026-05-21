import { useEffect, useState } from 'react';

const DEFAULT_TEXT = '://Welcome </To> ://Gnoseon [idn] ://Selamat_datang </Di> ://Gnoseon>';

function renderColoredText(text: string, keyPrefix: string) {
  return text.split('').map((char, index) => {
    let colorClass = 'text-gray-500';
    let isBold = false;

    if (char.match(/[a-zA-Z]/)) {
      colorClass = 'text-green-600';
      isBold = true;
    } else if (['<', '>', '[', ']'].includes(char)) {
      colorClass = 'text-purple-600';
      isBold = true;
    } else if ([':', '/', '_'].includes(char)) {
      colorClass = 'text-gray-400';
    }

    return (
      <span
        key={`${keyPrefix}-${index}`}
        className={`${colorClass} ${isBold ? 'font-bold' : 'font-normal'} text-sm`}
      >
        {char}
      </span>
    );
  });
}

export function MarqueeText() {
  const [text, setText] = useState(DEFAULT_TEXT);

  useEffect(() => {
    const savedText = localStorage.getItem('gnoseon_marquee_text');
    if (savedText) setText(savedText);
  }, []);

  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'gnoseon-marquee-style';
    style.textContent = `
      @keyframes gnoseon-marquee {
        0%   { transform: translateX(0); }
        100% { transform: translateX(-50%); }
      }
      .gnoseon-marquee-track {
        display: flex;
        width: max-content;
        white-space: nowrap;
        animation: gnoseon-marquee 18s linear infinite;
      }
      .gnoseon-marquee-track:hover {
        animation-play-state: paused;
      }
    `;

    const existing = document.getElementById('gnoseon-marquee-style');
    if (existing) existing.remove();
    document.head.appendChild(style);

    return () => {
      document.getElementById('gnoseon-marquee-style')?.remove();
    };
  }, []);

  return (
    <div
      className="relative overflow-hidden flex items-center h-8 w-full"
      style={{ fontFamily: 'JetBrains Mono, Space Mono, Courier New, monospace' }}
    >
      <div className="gnoseon-marquee-track">
        <span className="inline-block pr-12">
          {renderColoredText(text, 'a')}
        </span>
        <span className="inline-block pr-12">
          {renderColoredText(text, 'b')}
        </span>
      </div>
    </div>
  );
}
