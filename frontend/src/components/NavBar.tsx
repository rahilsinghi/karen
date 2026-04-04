"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ProviderToggle } from "@/components/ProviderToggle";

export function NavBar() {
    const pathname = usePathname();

    // Hide on /escalation/[id] and /join
    if (!pathname || pathname.startsWith("/escalation") || pathname.startsWith("/join")) {
        return null;
    }

    const links = [
        { href: "/", label: "The Circle" },
        { href: "/trigger", label: "Trigger" },
        { href: "/open-matters", label: "Open Matters" },
        { href: "/karen", label: "Karen" },
    ];

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 h-14 bg-stone-900/95 border-b-4 border-stone-800 flex items-center px-6">
            <div className="flex items-center gap-3">
                <span className="text-xl">💀</span>
                <span className="font-display text-lg tracking-tighter text-text">KAREN</span>
            </div>

            <div className="ml-12 flex items-center gap-8">
                {links.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`font-display text-sm uppercase tracking-wider transition-colors ${isActive
                                ? "text-red-500 text-shadow-pixel"
                                : "text-stone-500 hover:text-stone-300"
                                }`}
                        >
                            {link.label}
                        </Link>
                    );
                })}
            </div>

            <div className="ml-auto">
                <ProviderToggle />
            </div>
        </nav>
    );
}
