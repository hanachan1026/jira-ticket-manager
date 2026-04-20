import React from "react";
import { cn } from "../../utils/cn";

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "blue" | "green" | "yellow" | "red";
}

export function Badge({ children, className, variant = "default" }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        {
          "bg-gray-100 text-gray-600": variant === "default",
          "bg-blue-100 text-blue-700": variant === "blue",
          "bg-green-100 text-green-700": variant === "green",
          "bg-yellow-100 text-yellow-700": variant === "yellow",
          "bg-red-100 text-red-700": variant === "red",
        },
        className
      )}
    >
      {children}
    </span>
  );
}
