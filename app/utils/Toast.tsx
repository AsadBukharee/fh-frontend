import React from 'react';
import { CheckCircle, Info, XCircle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  type?: ToastType;
  message: string;
}

const Toast: React.FC<ToastProps> = ({ type = 'success', message }) => {
  const iconMap = {
    success: <CheckCircle className="text-green-600 w-5 h-5" />,
    error: <XCircle className="text-red-600 w-5 h-5" />,
    info: <Info className="text-blue-600 w-5 h-5" />,
  };

  const styleMap = {
    success: 'text-white bg-[#02D428] border-green-300',
    error: 'text-white bg-[#DB2A47] border-red-300',
    info: 'text-white bg-[#1E40AF] border-blue-300',
  };

  return (
    <div
      className={`flex items-center fixed top-3 left-1/2 -translate-x-1/2 gap-3 px-4 py-3 rounded-lg border
      shadow-md transition-all duration-300 ease-out
      ${styleMap[type]}
      `}
    >
      <div className="bg-white p-1.5 rounded-full">{iconMap[type]}</div>
      <span className="text-sm font-medium  shrink-0 whitespace-nowrap">{message}</span>
    </div>
  );
};

export default Toast;
