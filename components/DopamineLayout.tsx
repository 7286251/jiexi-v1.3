
import React from 'react';

interface Props {
  children: React.ReactNode;
}

export const DopamineLayout: React.FC<Props> = ({ children }) => {
  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center">
      <div className="max-w-4xl w-full">
        {children}
      </div>
      
      {/* Background Decor */}
      <div className="fixed -z-10 top-10 left-10 w-24 h-24 bg-yellow-400 rounded-full blur-xl opacity-20 floating"></div>
      <div className="fixed -z-10 bottom-20 right-10 w-32 h-32 bg-pink-400 rounded-full blur-xl opacity-20 floating" style={{animationDelay: '1s'}}></div>
      <div className="fixed -z-10 top-1/2 left-20 w-16 h-16 bg-blue-400 rounded-full blur-xl opacity-20 floating" style={{animationDelay: '1.5s'}}></div>
    </div>
  );
};
