import React from 'react';
import { LogIn } from 'lucide-react'; 

interface GradientButtonProps {
  text: string;
  Icon?: React.ElementType;
  onClick?: () => void;
    width?: string;
}

const GradientButton: React.FC<GradientButtonProps> = ({ text, Icon = LogIn, onClick, width }) => {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-white font-medium shadow-md transition-all duration-300 hover:opacity-90"
      style={{
        background: 'linear-gradient(90deg, #f85032 0%, #e73827 20%, #662D8C 100%)',
        width: width || 'auto',
        height: 'auto',
      }}
    >
      <span>{text}</span>
      {Icon && <Icon size={18} />}
    </button>
  );
};

export default GradientButton;
