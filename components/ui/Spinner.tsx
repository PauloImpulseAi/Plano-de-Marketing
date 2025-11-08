
import React from 'react';

const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
  };

  return (
    <div className="flex justify-center items-center p-4">
      <div className={`${sizeClasses[size]} border-4 border-gray-500 border-t-blue-500 rounded-full animate-spin`}></div>
    </div>
  );
};

export default Spinner;
