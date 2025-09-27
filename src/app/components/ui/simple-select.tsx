"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface SimpleSelectProps {
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
  defaultValue?: string;
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

const SimpleSelect = ({ onValueChange, children, className = "", defaultValue }: SimpleSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(defaultValue || "");
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
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
    setIsOpen(!isOpen);
  };

  const handleItemClick = (itemValue: string) => {
    setSelectedValue(itemValue);
    onValueChange(itemValue);
    setIsOpen(false);
  };

  return (
    <div ref={selectRef} className={`relative ${className}`}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          if (child.type === SimpleSelectTrigger) {
            return React.cloneElement(child, {
              onClick: handleTriggerClick,
              isOpen,
              selectedValue
            });
          }
          if (child.type === SimpleSelectContent) {
            return React.cloneElement(child, {
              isOpen,
              onItemClick: handleItemClick,
              selectedValue
            });
          }
        }
        return child;
      })}
    </div>
  );
};

const SimpleSelectTrigger = React.forwardRef<
  HTMLButtonElement, 
  SimpleSelectTriggerProps & { 
    onClick?: () => void; 
    isOpen?: boolean;
    selectedValue?: string;
  }
>(({ children, className = "", onClick, isOpen, selectedValue }, ref) => {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      className={`flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 hover:bg-gray-50 ${className}`}
    >
      <span className={selectedValue ? "text-gray-900" : "text-gray-500"}>
        {children}
      </span>
      <ChevronDown 
        className={`h-4 w-4 opacity-50 transition-transform duration-200 ${
          isOpen ? 'rotate-180' : ''
        }`} 
      />
    </button>
  );
});

SimpleSelectTrigger.displayName = "SimpleSelectTrigger";

const SimpleSelectContent = ({ 
  children, 
  className = "", 
  isOpen, 
  onItemClick,
  selectedValue 
}: SimpleSelectContentProps & { 
  isOpen?: boolean; 
  onItemClick?: (value: string) => void;
  selectedValue?: string;
}) => {
  if (!isOpen) return null;

  return (
    <div className={`absolute z-50 min-w-full overflow-hidden rounded-md border bg-white py-1 shadow-lg top-full left-0 right-0 mt-1 ${className}`}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === SimpleSelectItem) {
          return React.cloneElement(child, { 
            onItemClick,
            isSelected: selectedValue === child.props.value
          });
        }
        return child;
      })}
    </div>
  );
};

const SimpleSelectItem = ({ 
  value, 
  children, 
  className = "", 
  onItemClick,
  isSelected 
}: SimpleSelectItemProps & { 
  onItemClick?: (value: string) => void;
  isSelected?: boolean;
}) => {
  const handleClick = () => {
    if (onItemClick) {
      onItemClick(value);
    }
  };

  return (
    <div
      className={`relative flex w-full cursor-pointer select-none items-center py-2 px-3 text-sm outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100 ${
        isSelected ? 'bg-gray-100 font-medium' : ''
      } ${className}`}
      onClick={handleClick}
    >
      {children}
      {isSelected && (
        <span className="absolute right-3 flex h-3.5 w-3.5 items-center justify-center">
          ✓
        </span>
      )}
    </div>
  );
};

const SimpleSelectValue = ({ placeholder = "Select an option" }: SimpleSelectValueProps) => {
  return <span>{placeholder}</span>;
};

export {
  SimpleSelect,
  SimpleSelectContent,
  SimpleSelectItem,
  SimpleSelectTrigger,
  SimpleSelectValue,
};