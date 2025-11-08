import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { TourStep } from '../types';
import Button from './ui/Button';

interface TourProps {
  steps: TourStep[];
  stepIndex: number;
  setStepIndex: React.Dispatch<React.SetStateAction<number>>;
  onClose: () => void;
}

const Tour: React.FC<TourProps> = ({ steps, stepIndex, setStepIndex, onClose }) => {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const currentStep = steps[stepIndex];
  const previousTargetRef = useRef<Element | null>(null);

  useLayoutEffect(() => {
    if (currentStep.action) {
      currentStep.action();
    }
    
    // Cleanup previous highlight
    if (previousTargetRef.current) {
        previousTargetRef.current.classList.remove('tour-highlight');
    }

    const timer = setTimeout(() => {
      const targetElement = document.querySelector(currentStep.target);
      if (targetElement) {
        targetElement.classList.add('tour-highlight');
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        setTargetRect(targetElement.getBoundingClientRect());
        previousTargetRef.current = targetElement;
      } else {
        setTargetRect(null); // Center modal if no target
      }
    }, 100); // Small delay to allow potential re-renders from action()

    return () => {
        clearTimeout(timer);
         if (previousTargetRef.current) {
            previousTargetRef.current.classList.remove('tour-highlight');
        }
    };

  }, [stepIndex, currentStep]);

  const handleNext = () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1);
    }
  };
  
  const getPopoverPosition = () => {
    if (!targetRect || currentStep.position === 'center') {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }
    
    const offset = 12;
    switch (currentStep.position) {
      case 'bottom':
        return { top: targetRect.bottom + offset, left: targetRect.left + targetRect.width / 2, transform: 'translateX(-50%)' };
      case 'top':
        return { top: targetRect.top - offset, left: targetRect.left + targetRect.width / 2, transform: 'translate(-50%, -100%)' };
      case 'right':
        return { top: targetRect.top + targetRect.height / 2, left: targetRect.right + offset, transform: 'translateY(-50%)' };
      case 'left':
        return { top: targetRect.top + targetRect.height / 2, left: targetRect.left - offset, transform: 'translate(-100%, -50%)' };
      default:
        return { top: targetRect.bottom + offset, left: targetRect.left };
    }
  };
  
  const position = getPopoverPosition();

  return (
    <div className="fixed inset-0 z-50">
        <div 
          className="fixed z-[9998] bg-white rounded-lg shadow-2xl p-4 w-80 text-gray-800 transition-all duration-300"
          style={position}
        >
            <h3 className="text-lg font-bold mb-2">{currentStep.title}</h3>
            <p className="text-sm mb-4">{currentStep.content}</p>
            <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">{stepIndex + 1} / {steps.length}</span>
                <div className="flex gap-2">
                    {stepIndex > 0 && <Button onClick={handlePrev} variant="secondary" className="py-1 px-3 text-sm">Anterior</Button>}
                    <Button onClick={handleNext} className="py-1 px-3 text-sm">
                        {stepIndex === steps.length - 1 ? 'Finalizar' : 'Próximo'}
                    </Button>
                </div>
            </div>
             <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600">&times;</button>
        </div>
    </div>
  );
};

export default Tour;