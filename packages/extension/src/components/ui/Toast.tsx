import React, { useEffect, useState } from "react";
import { CheckIcon } from "lucide-react";
import { cn } from "../../utils/cn";

interface ToastProps {
  message: string;
  show: boolean;
}

export function Toast({ message, show }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
    } else {
      const timer = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!visible) return null;

  return (
    <div
      className={cn(
        "fixed bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2 text-xs text-white shadow-lg transition-opacity duration-300",
        show ? "opacity-100" : "opacity-0"
      )}
    >
      <CheckIcon size={12} />
      {message}
    </div>
  );
}
