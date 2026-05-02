"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavBarProps {
  raceName?: string;
}

export function NavBar({ raceName }: NavBarProps) {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Plans" },
    { href: "/plan/editor", label: "Editor" },
    { href: "/plan/race-plan", label: "Race Plan" },
    { href: "/products", label: "Products" },
    { href: "/settings", label: "Settings" },
  ];

  return (
    <header className="border-b print:hidden">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-bold text-base tracking-tight">
            Backhalf
          </Link>
          {raceName && (
            <span className="text-sm text-muted-foreground hidden sm:block">{raceName}</span>
          )}
        </div>
        <nav className="flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-3 py-1.5 text-sm rounded-md transition-colors",
                pathname === link.href
                  ? "bg-muted font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
