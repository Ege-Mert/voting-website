import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const StarRating = ({ 
  value = 0, 
  onChange, 
  readOnly = false,
  size = 'md'
}: StarRatingProps) => {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const [currentValue, setCurrentValue] = useState(value);
  
  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  const handleMouseEnter = (index: number) => {
    if (!readOnly) {
      setHoverValue(index);
    }
  };

  const handleMouseLeave = () => {
    if (!readOnly) {
      setHoverValue(null);
    }
  };

  const handleClick = (index: number) => {
    if (!readOnly) {
      const newValue = index === currentValue ? 0 : index;
      setCurrentValue(newValue);
      onChange(newValue);
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case 'sm': return 'w-4 h-4';
      case 'lg': return 'w-8 h-8';
      default: return 'w-6 h-6';
    }
  };

  return (
    <div className="star-rating" onMouseLeave={handleMouseLeave}>
      {[1, 2, 3, 4, 5].map((index) => {
        const isActive = (hoverValue !== null ? hoverValue >= index : currentValue >= index);
        
        return (
          <motion.div
            key={index}
            className={`star-rating-item ${isActive ? 'active' : ''}`}
            whileHover={{ scale: readOnly ? 1 : 1.1 }}
            whileTap={{ scale: readOnly ? 1 : 0.9 }}
            onMouseEnter={() => handleMouseEnter(index)}
            onClick={() => handleClick(index)}
          >
            <Star 
              className={`${getSizeClass()} ${isActive ? 'fill-current text-gold' : 'text-gray-300'}`} 
            />
          </motion.div>
        );
      })}
    </div>
  );
};

export default StarRating;