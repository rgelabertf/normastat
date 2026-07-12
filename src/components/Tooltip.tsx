import React, { useState } from "react";
import { HelpCircle } from "lucide-react";

interface TooltipProps {
  title: string;
  description: string;
  details?: string[];
  align?: "left" | "center" | "right";
}

export const Tooltip: React.FC<TooltipProps> = ({
  title,
  description,
  details,
  align = "center",
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const alignmentClasses = {
    left: "left-0",
    center: "left-1/2 -translate-x-1/2",
    right: "right-0",
  };

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onBlur={() => setIsOpen(false)}
        className="text-zinc-400 hover:text-zinc-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-full"
        aria-label={`Ayuda sobre ${title}`}
      >
        <HelpCircle className="w-3.5 h-3.5 cursor-help" />
      </button>

      {isOpen && (
        <div
          className={`absolute bottom-full mb-2 z-50 w-72 p-4 bg-zinc-900 dark:bg-[#1C2128] text-zinc-100 rounded-xl shadow-xl border border-zinc-800 dark:border-[#30363D] text-xs pointer-events-auto transition-all duration-150 animate-fade-in ${alignmentClasses[align]}`}
        >
          {/* Caret/Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-900 dark:border-t-[#1C2128]"></div>
          
          <h5 className="font-bold text-white mb-1.5 flex items-center gap-1.5 text-[12px]">
            {title}
          </h5>
          <p className="text-zinc-300 dark:text-gray-300 leading-relaxed font-normal">
            {description}
          </p>
          {details && details.length > 0 && (
            <ul className="mt-2 pt-2 border-t border-zinc-800 dark:border-[#30363D] space-y-1 text-[10px] text-zinc-400 dark:text-gray-400 font-mono">
              {details.map((detail, index) => (
                <li key={index} className="flex items-start gap-1">
                  <span className="text-blue-400 select-none">›</span>
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
