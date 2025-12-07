import { useState, ReactNode } from 'react';
import { Info } from 'lucide-react';

interface TooltipProps {
  content: string | ReactNode;
  children?: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export function Tooltip({ content, children, position = 'top', className = '' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const getArrowPosition = () => {
    const arrowOffset = '-4px';
    const arrowTransform = 'rotate(45deg)';
    
    if (position === 'top' || position === 'bottom') {
      return {
        [position === 'top' ? 'bottom' : 'top']: arrowOffset,
        left: '50%',
        transform: `translateX(-50%) ${arrowTransform}`,
      };
    } else {
      return {
        [position === 'left' ? 'right' : 'left']: arrowOffset,
        top: '50%',
        transform: `translateY(-50%) ${arrowTransform}`,
      };
    }
  };

  return (
    <div className="relative inline-flex">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className={`cursor-help ${className}`}
      >
        {children || <Info className="w-4 h-4 text-gray-400 hover:text-gray-600" />}
      </div>
      {isVisible && (
        <div
          className={`absolute z-50 px-3 py-2 text-xs font-medium text-white bg-gray-900 rounded-lg shadow-lg whitespace-nowrap ${positionClasses[position]}`}
        >
          {content}
          <div 
            className="absolute w-2 h-2 bg-gray-900"
            style={getArrowPosition()}
          />
        </div>
      )}
    </div>
  );
}
