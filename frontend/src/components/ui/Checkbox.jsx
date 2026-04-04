import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";

export function Checkbox({ className = "", ...props }) {
    return (
        <CheckboxPrimitive.Root
            className={`peer border-gray-300 dark:border-gray-600 data-[state=checked]:bg-green-600 data-[state=checked]:dark:bg-green-500 data-[state=checked]:text-white data-[state=checked]:border-green-600 data-[state=checked]:dark:border-green-500 focus-visible:border-green-500 focus-visible:ring-green-500/50 w-5 h-5 shrink-0 rounded border-2 shadow-sm transition-all outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
            {...props}
        >
            <CheckboxPrimitive.Indicator className="grid place-content-center text-current transition-none">
                <Check className="w-3.5 h-3.5" strokeWidth={3} />
            </CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>
    );
}
