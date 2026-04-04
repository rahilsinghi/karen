"use client";

import { usePathname } from "next/navigation";

export function Footer() {
    const pathname = usePathname();

    // Hide on /escalation/[id] and /join
    if (pathname.startsWith("/escalation") || pathname.startsWith("/join")) {
        return null;
    }

    return (
        <footer className="py-4 border-t border-stone-900 bg-bg mt-auto">
            <div className="container mx-auto px-6 text-center font-mono text-[10px] text-stone-600 space-y-1">
                <p>&quot;Karen is always watching. Karen means well.&quot;</p>
                <p>
                    &copy; Karen Automated Correspondence Systems LLC — All rights reserved.
                    All matters documented. All debts remembered.
                </p>
            </div>
        </footer>
    );
}
