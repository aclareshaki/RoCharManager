import { ReactNode, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface ROPanelProps {
  title?: string;
  children: ReactNode;
  className?: string;
  headerAction?: ReactNode;
}

export function ROPanel({ title, children, className, headerAction }: ROPanelProps) {
  return (
    <div className={cn(
      "relative bg-[rgba(16,32,48,0.95)] border-2 border-[#2b4e6b] rounded-lg shadow-xl backdrop-blur-sm flex flex-col overflow-hidden",
      "before:content-[''] before:absolute before:inset-0 before:bg-gradient-to-b before:from-[#2b4e6b]/10 before:to-transparent before:pointer-events-none",
      className
    )}>
      {title && (
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#1c2b3a] to-[#121c26] border-b border-[#2b4e6b]">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#cedce7] drop-shadow-sm select-none">
            {title}
          </h2>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className="flex-1 overflow-auto p-4 custom-scrollbar">
        {children}
      </div>
    </div>
  );
}

interface ROButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "danger" | "ghost" | "icon";
  size?: "sm" | "md" | "lg";
}

export const ROButton = forwardRef<HTMLButtonElement, ROButtonProps>(({ 
  children, 
  className, 
  variant = "primary", 
  size = "md",
  ...props 
}, ref) => {
  const baseStyles = "relative font-semibold uppercase tracking-wide transition-all duration-200 active:translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed border";
  
  const variants = {
    primary: "bg-gradient-to-b from-[#4a7ba3] to-[#2b4e6b] hover:from-[#5a8bbd] hover:to-[#3b5e7b] border-[#5a8bbd] text-white shadow-[0_2px_0_#1a2e3f]",
    danger: "bg-gradient-to-b from-[#a34a4a] to-[#6b2b2b] hover:from-[#bd5a5a] hover:to-[#7b3b3b] border-[#bd5a5a] text-white shadow-[0_2px_0_#3f1a1a]",
    ghost: "bg-transparent border-transparent hover:bg-white/5 text-[#a0c0e0] hover:text-white",
    icon: "p-2 bg-[#1c2b3a] border-[#2b4e6b] hover:bg-[#2b4e6b] hover:border-[#5a8bbd] text-[#a0c0e0] hover:text-white rounded-md flex items-center justify-center",
  };

  const sizes = {
    sm: "px-2 py-1 text-xs rounded",
    md: "px-4 py-2 text-xs rounded-md",
    lg: "px-6 py-3 text-sm rounded-lg",
  };

  // Override sizes for icon variant
  if (variant === "icon") {
    // sizing handled in base class for icon
  }

  return (
    <button 
      ref={ref}
      className={cn(baseStyles, variants[variant], variant !== "icon" && sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
});
ROButton.displayName = "ROButton";

export function ROInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full bg-[#0a1018] border border-[#2b4e6b] text-[#a0c0e0] px-3 py-2 rounded-md",
        "focus:outline-none focus:border-[#5a8bbd] focus:ring-1 focus:ring-[#5a8bbd]/30",
        "placeholder:text-[#2b4e6b] text-sm transition-colors"
      )}
      {...props}
    />
  );
}
