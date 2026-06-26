import type { ButtonHTMLAttributes, ReactNode } from "react";

export function WinButton({ variant = "default", icon, className = "", children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "primary" | "danger"; icon?: ReactNode }) {
  return <button className={`button ${variant} ${className}`} {...props}>{icon}{children}</button>;
}
