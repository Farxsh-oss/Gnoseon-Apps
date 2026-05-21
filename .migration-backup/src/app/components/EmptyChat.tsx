import React from 'react';
import kepalaRobot from '@/assets/Kepala-Robot-Gnoseon.png';

export const EmptyChat: React.FC = () => {
  return (
    <div className="flex-1 flex items-center justify-center bg-[#e6e9f0]" style={{ fontFamily: 'var(--font-mono)' }}>
      <div className="text-center neu-flat p-12 rounded-2xl mt-20">
        <div className="mb-4 flex justify-center">
          <img 
            src={kepalaRobot} 
            alt="Kepala Robot Gnoseon"
            className="w-24 h-24 object-contain"
          />
        </div>
        <p className="text-gray-500 text-sm mt-4">
          <span className="text-purple-600">$</span> select_chat <span className="text-green-600">--start</span>
        </p>
        <p className="text-gray-400 text-xs mt-2">// Choose a conversation to begin messaging</p>
      </div>
    </div>
  );
};
