import * as React from "react";
import * as RadixSwitch from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

const Switch = React.forwardRef<React.ElementRef<typeof RadixSwitch.Root>, React.ComponentPropsWithoutRef<typeof RadixSwitch.Root>>(
  ({ className, ...props }, ref) => (
    <RadixSwitch.Root
      ref={ref}
      className={cn(
        "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-transparent",
        "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
        "data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-200",
        "dark:data-[state=checked]:bg-blue-500 dark:data-[state=unchecked]:bg-slate-700",
        "dark:focus-visible:ring-blue-400",
        className
      )}
      {...props}
    >
      <RadixSwitch.Thumb
        className={cn(
          "pointer-events-none block h-4 w-4 translate-x-0 rounded-full bg-white shadow-lg ring-0 transition-transform",
          "data-[state=checked]:translate-x-4"
        )}
      />
    </RadixSwitch.Root>
  )
);
Switch.displayName = "Switch";

export { Switch };

