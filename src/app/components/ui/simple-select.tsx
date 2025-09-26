"use client";"use client";"use client";"use client";



import React, { useState } from "react";

import { ChevronDown } from "lucide-react";

import React, { useState, useRef, useEffect } from "react";

interface SimpleSelectProps {

  onValueChange: (value: string) => void;import { ChevronDown } from "lucide-react";

  children: React.ReactNode;

  className?: string;import React, { useState, useRef, useEffect } from "react";import React, { useState, useRef, useEffect } from "react";

}

interface SimpleSelectProps {

interface SimpleSelectTriggerProps {

  children: React.ReactNode;  onValueChange: (value: string) => void;import { ChevronDown } from "lucide-react";import { ChevronDown } from "lucide-react";

  className?: string;

}  children: React.ReactNode;



interface SimpleSelectContentProps {  className?: string;

  children: React.ReactNode;

  className?: string;}

}

interface SimpleSelectProps {interface SimpleSelectProps {

interface SimpleSelectItemProps {

  value: string;interface SimpleSelectTriggerProps {

  children: React.ReactNode;

  className?: string;  children: React.ReactNode;  onValueChange: (value: string) => void;  value: string;

}

  className?: string;

const SimpleSelect = ({ onValueChange, children, className = "" }: SimpleSelectProps) => {

  const [isOpen, setIsOpen] = useState(false);  onClick?: () => void;  children: React.ReactNode;  onValueChange: (value: string) => void;



  const handleTriggerClick = () => {  isOpen?: boolean;

    setIsOpen(!isOpen);

  };}  className?: string;  children: React.ReactNode;



  const handleItemClick = (itemValue: string) => {

    onValueChange(itemValue);

    setIsOpen(false);interface SimpleSelectContentProps {}  className?: string;

  };

  children: React.ReactNode;

  return (

    <div className={`relative ${className}`}>  className?: string;}

      <div onClick={handleTriggerClick}>

        {React.Children.toArray(children).find(child =>   isOpen?: boolean;

          React.isValidElement(child) && child.type === SimpleSelectTrigger

        )}  onItemClick?: (value: string) => void;interface SimpleSelectTriggerProps {

      </div>

      {isOpen && (}

        <div className="absolute z-50 mt-1 min-w-full rounded-md border bg-white py-1 shadow-lg">

          {React.Children.toArray(children).filter(child =>   children: React.ReactNode;interface SimpleSelectTriggerProps {

            React.isValidElement(child) && child.type === SimpleSelectContent

          ).map((content, index) => interface SimpleSelectItemProps {

            React.isValidElement(content) ? (

              <div key={index}>  value: string;  className?: string;  children: React.ReactNode;

                {React.Children.toArray(content.props.children).map((item, itemIndex) => 

                  React.isValidElement(item) && item.type === SimpleSelectItem ? (  children: React.ReactNode;

                    <div 

                      key={itemIndex}  className?: string;  onClick?: () => void;  className?: string;

                      onClick={() => handleItemClick(item.props.value)}

                      className="cursor-pointer px-4 py-2 text-sm hover:bg-gray-100"  onItemClick?: (value: string) => void;

                    >

                      {item.props.children}}  isOpen?: boolean;}

                    </div>

                  ) : null

                )}

              </div>const SimpleSelect = ({ onValueChange, children, className = "" }: SimpleSelectProps) => {}

            ) : null

          )}  const [isOpen, setIsOpen] = useState(false);

        </div>

      )}  const triggerRef = useRef<HTMLButtonElement>(null);interface SimpleSelectContentProps {

    </div>

  );

};

  useEffect(() => {interface SimpleSelectContentProps {  children: React.ReactNode;

const SimpleSelectTrigger = ({ children, className = "" }: SimpleSelectTriggerProps) => {

  return (    const handleClickOutside = (event: MouseEvent) => {

    <button

      type="button"      if (triggerRef.current && !triggerRef.current.contains(event.target as Node)) {  children: React.ReactNode;  className?: string;

      className={`flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 ${className}`}

    >        setIsOpen(false);

      {children}

      <ChevronDown className="h-4 w-4 opacity-50" />      }  className?: string;}

    </button>

  );    };

};

  isOpen?: boolean;

const SimpleSelectContent = ({ children, className = "" }: SimpleSelectContentProps) => {

  return <div className={className}>{children}</div>;    document.addEventListener('mousedown', handleClickOutside);

};

    return () => {  onItemClick?: (value: string) => void;interface SimpleSelectItemProps {

const SimpleSelectItem = ({ value, children, className = "" }: SimpleSelectItemProps) => {

  return <div data-value={value} className={className}>{children}</div>;      document.removeEventListener('mousedown', handleClickOutside);

};

    };}  value: string;

export { SimpleSelect, SimpleSelectTrigger, SimpleSelectContent, SimpleSelectItem };
  }, []);

  children: React.ReactNode;

  const handleTriggerClick = () => {

    setIsOpen(!isOpen);interface SimpleSelectItemProps {  className?: string;

  };

  value: string;}

  const handleItemClick = (itemValue: string) => {

    onValueChange(itemValue);  children: React.ReactNode;

    setIsOpen(false);

  };  className?: string;interface SimpleSelectValueProps {



  return (  onItemClick?: (value: string) => void;  placeholder?: string;

    <div className={`relative ${className}`}>

      {React.Children.map(children, (child) => {}}

        if (React.isValidElement(child) && child.type === SimpleSelectTrigger) {

          return React.cloneElement(child, {

            onClick: handleTriggerClick,

            isOpenconst SimpleSelect = ({ onValueChange, children, className = "" }: SimpleSelectProps) => {const SimpleSelect = ({ onValueChange, children, className = "" }: SimpleSelectProps) => {

          });

        }  const [isOpen, setIsOpen] = useState(false);  const [isOpen, setIsOpen] = useState(false);

        if (React.isValidElement(child) && child.type === SimpleSelectContent) {

          return React.cloneElement(child, {   const triggerRef = useRef<HTMLButtonElement>(null);  const triggerRef = useRef<HTMLButtonElement>(null);

            isOpen,

            onItemClick: handleItemClick

          });

        }  useEffect(() => {  useEffect(() => {

        return child;

      })}    const handleClickOutside = (event: MouseEvent) => {    const handleClickOutside = (event: MouseEvent) => {

    </div>

  );      if (triggerRef.current && !triggerRef.current.contains(event.target as Node)) {      if (triggerRef.current && !triggerRef.current.contains(event.target as Node)) {

};

        setIsOpen(false);        setIsOpen(false);

const SimpleSelectTrigger = ({ children, className = "", onClick, isOpen }: SimpleSelectTriggerProps) => {

  return (      }      }

    <button

      type="button"    };    };

      onClick={onClick}

      className={`flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 ${className}`}

    >

      {children}    document.addEventListener('mousedown', handleClickOutside);    if (isOpen) {

      <ChevronDown className={`h-4 w-4 opacity-50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />

    </button>    return () => {      document.addEventListener('mousedown', handleClickOutside);

  );

};      document.removeEventListener('mousedown', handleClickOutside);    }



const SimpleSelectContent = ({ children, className = "", isOpen = false, onItemClick }: SimpleSelectContentProps) => {    };

  if (!isOpen) return null;

  }, []);    return () => {

  return (

    <div className={`absolute z-50 mt-1 min-w-full rounded-md border bg-white py-1 shadow-lg ${className}`}>      document.removeEventListener('mousedown', handleClickOutside);

      {React.Children.map(children, (child) => {

        if (React.isValidElement(child) && child.type === SimpleSelectItem) {  const handleTriggerClick = () => {    };

          return React.cloneElement(child, { onItemClick });

        }    setIsOpen(!isOpen);  }, [isOpen]);

        return child;

      })}  };

    </div>

  );  const handleTriggerClick = () => {

};

  const handleItemClick = (itemValue: string) => {    console.log('🎯 SimpleSelect trigger clicked');

const SimpleSelectItem = ({ value, children, className = "", onItemClick }: SimpleSelectItemProps) => {

  const handleClick = () => {    onValueChange(itemValue);    setIsOpen(!isOpen);

    onItemClick?.(value);

  };    setIsOpen(false);  };



  return (  };

    <div

      onClick={handleClick}  const handleItemClick = (itemValue: string) => {

      className={`cursor-pointer px-4 py-2 text-sm hover:bg-gray-100 ${className}`}

    >  return (    console.log('🎯 SimpleSelect item clicked:', itemValue);

      {children}

    </div>    <div className={`relative ${className}`}>    onValueChange(itemValue);

  );

};      {React.Children.map(children, (child) => {    setIsOpen(false);



export { SimpleSelect, SimpleSelectTrigger, SimpleSelectContent, SimpleSelectItem };        if (React.isValidElement(child)) {  };

          if (child.type === SimpleSelectTrigger) {

            return React.cloneElement(child, {  return (

              onClick: handleTriggerClick,    <div className={`relative ${className}`}>

              isOpen      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}

            });      {React.Children.map(children, (child) => {

          }        if (React.isValidElement(child)) {

          if (child.type === SimpleSelectContent) {          if (child.type === SimpleSelectTrigger) {

            return React.cloneElement(child, {             return React.cloneElement(child as React.ReactElement<any>, {

              isOpen,              onClick: handleTriggerClick,

              onItemClick: handleItemClick              isOpen

            });            });

          }          }

        }          if (child.type === SimpleSelectContent) {

        return child;            return React.cloneElement(child as React.ReactElement<any>, { 

      })}              isOpen,

    </div>              onItemClick: handleItemClick

  );            });

};          }

        }

const SimpleSelectTrigger = ({ children, className = "", onClick, isOpen }: SimpleSelectTriggerProps) => {        return child;

  return (      })}

    <button    </div>

      type="button"  );

      onClick={onClick}};

      className={`flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 ${className}`}

    >const SimpleSelectTrigger = React.forwardRef<HTMLButtonElement, SimpleSelectTriggerProps & { onClick?: () => void; isOpen?: boolean }>(

      {children}  ({ children, className = "", onClick, isOpen }, ref) => {

      <ChevronDown className={`h-4 w-4 opacity-50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />    return (

    </button>      <button

  );        ref={ref}

};        type="button"

        onClick={onClick}

const SimpleSelectContent = ({ children, className = "", isOpen = false, onItemClick }: SimpleSelectContentProps) => {        className={`flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 ${className}`}

  if (!isOpen) return null;      >

        {children}

  return (        <ChevronDown className={`h-4 w-4 opacity-50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />

    <div className={`absolute z-50 mt-1 min-w-full rounded-md border bg-white py-1 shadow-lg ${className}`}>      </button>

      {React.Children.map(children, (child) => {    );

        if (React.isValidElement(child) && child.type === SimpleSelectItem) {  }

          return React.cloneElement(child, { onItemClick }););

        }

        return child;SimpleSelectTrigger.displayName = "SimpleSelectTrigger";

      })}

    </div>const SimpleSelectContent = ({ children, className = "", isOpen, onItemClick }: SimpleSelectContentProps & { isOpen?: boolean; onItemClick?: (value: string) => void }) => {

  );  console.log('🎯 SimpleSelectContent render, isOpen:', isOpen);

};  if (!isOpen) return null;



const SimpleSelectItem = ({ value, children, className = "", onItemClick }: SimpleSelectItemProps) => {  return (

  const handleClick = () => {    <div className={`absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-white p-1 text-gray-900 shadow-lg top-full left-0 right-0 mt-1 ${className}`}>

    if (onItemClick) {      {React.Children.map(children, (child) => {

      onItemClick(value);        if (React.isValidElement(child) && child.type === SimpleSelectItem) {

    }          console.log('🎯 Cloning SimpleSelectItem with onItemClick');

  };          return React.cloneElement(child, { onItemClick });

        }

  return (        return child;

    <div      })}

      onClick={handleClick}    </div>

      className={`cursor-pointer px-4 py-2 text-sm hover:bg-gray-100 ${className}`}  );

    >};

      {children}

    </div>const SimpleSelectItem = ({ value, children, className = "", onItemClick }: SimpleSelectItemProps & { onItemClick?: (value: string) => void }) => {

  );  const handleClick = () => {

};    console.log('🎯 SimpleSelectItem clicked:', value);

    if (onItemClick) {

export { SimpleSelect, SimpleSelectTrigger, SimpleSelectContent, SimpleSelectItem };      onItemClick(value);
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
