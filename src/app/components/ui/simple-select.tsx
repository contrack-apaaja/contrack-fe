"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface SimpleSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

interface SimpleSelectTriggerProps {
  children: React.ReactNode;
  className?: string;
}

interface SimpleSelectContentProps {
  children: React.ReactNode;
  className?: string;
}

interface SimpleSelectItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

interface SimpleSelectValueProps {
  placeholder?: string;
}

const SimpleSelect = ({ value, onValueChange, children, className = "" }: SimpleSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleTriggerClick = () => {
    console.log('🎯 SimpleSelect trigger clicked');
    setIsOpen(!isOpen);
  };

  const handleItemClick = (itemValue: string) => {
    console.log('🎯 SimpleSelect item clicked:', itemValue);
    onValueChange(itemValue);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          if (child.type === SimpleSelectTrigger) {
            return React.cloneElement(child as React.ReactElement<any>, {
              ref: triggerRef,
              onClick: handleTriggerClick,
              isOpen
            });
          }
          if (child.type === SimpleSelectContent) {
            return React.cloneElement(child, { 
              isOpen,
              onItemClick: handleItemClick
            });
          }
        }
        return child;
      })}
    </div>
  );
};

const SimpleSelectTrigger = React.forwardRef<HTMLButtonElement, SimpleSelectTriggerProps & { onClick?: () => void; isOpen?: boolean }>(
  ({ children, className = "", onClick, isOpen }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        className={`flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 ${className}`}
      >
        {children}
        <ChevronDown className={`h-4 w-4 opacity-50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
    );
  }
);

const SimpleSelectContent = ({ children, className = "", isOpen, onItemClick }: SimpleSelectContentProps & { isOpen?: boolean; onItemClick?: (value: string) => void }) => {
  console.log('🎯 SimpleSelectContent render, isOpen:', isOpen);
  if (!isOpen) return null;

  return (
    <div className={`absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-white p-1 text-gray-900 shadow-lg top-full left-0 right-0 mt-1 ${className}`}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === SimpleSelectItem) {
          console.log('🎯 Cloning SimpleSelectItem with onItemClick');
          return React.cloneElement(child, { onItemClick });
        }
        return child;
      })}
    </div>
  );
};

const SimpleSelectItem = ({ value, children, className = "", onItemClick }: SimpleSelectItemProps & { onItemClick?: (value: string) => void }) => {
  const handleClick = () => {
    console.log('🎯 SimpleSelectItem clicked:', value);
    if (onItemClick) {
      onItemClick(value);
    }
  };

  return (
    <div
      className={`relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-gray-100 ${className}`}
      onClick={handleClick}
    >
      {children}
    </div>
  );
};

const SimpleSelectValue = ({ placeholder }: SimpleSelectValueProps) => {
  return <span>{placeholder}</span>;
};

export {
  SimpleSelect,
  SimpleSelectContent,
  SimpleSelectItem,
  SimpleSelectTrigger,
  SimpleSelectValue,
};
