
import React from 'react';

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-6">
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 border-8 border-yellow-200 rounded-full"></div>
        <div className="absolute inset-0 border-8 border-t-pink-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
           <span className="text-4xl">🐱</span>
        </div>
      </div>
      <div className="space-y-2 text-center">
        <p className="cartoon-font text-2xl text-purple-600 font-bold animate-pulse">正在捕捉灵感...</p>
        <p className="text-sm text-gray-500">AI 正在深度解析每一个像素细节 ✨</p>
      </div>
    </div>
  );
};
