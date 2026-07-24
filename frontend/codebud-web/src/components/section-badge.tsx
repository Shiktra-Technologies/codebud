import React from "react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface SectionBadgeProps {
    children: React.ReactNode;
    className?: string;
}

/**
 * Section heading label — a neutral pill. Reimplemented on the shadcn Badge
 * per the restraint rule: it's a label, not a brand object, so it carries no
 * accent (the old honeycomb hex mark and yellow tint are gone).
 */
export function SectionBadge({ children, className }: SectionBadgeProps) {
    return (
        <Badge
            variant="secondary"
            className={cn(
                "px-3 py-1 text-[11px] font-medium uppercase tracking-widest text-muted-foreground",
                className,
            )}
        >
            {children}
        </Badge>
    );
}
