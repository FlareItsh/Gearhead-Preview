import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2.5 py-1 text-xs font-semibold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1.5 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[2px] aria-invalid:ring-red-300/50 dark:aria-invalid:ring-red-500/50 aria-invalid:border-red-300 transition-all duration-200 overflow-hidden shadow-sm hover:shadow-md",
  {
    variants: {
      variant: {
        default:
          "border-primary/80 bg-blue-600 text-white shadow-blue-600/30 hover:shadow-blue-600/40 [a&]:hover:bg-blue-700",
        secondary:
          "border-secondary/80 bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-200 shadow-gray-200/30 hover:shadow-gray-200/40 dark:shadow-gray-800/30 dark:hover:shadow-gray-800/40 [a&]:hover:bg-gray-300 dark:[a&]:hover:bg-gray-700",
        destructive:
          "border-red-300 bg-red-100 text-red-800 dark:border-red-600 dark:bg-red-900/20 dark:text-red-200 shadow-red-100/30 hover:shadow-red-100/40 dark:shadow-red-900/20 dark:hover:shadow-red-900/30 [a&]:hover:bg-red-200 dark:[a&]:hover:bg-red-900/30 focus-visible:ring-red-500/40 dark:focus-visible:ring-red-400/50",
        outline:
          "border-border/80 bg-transparent text-foreground shadow-transparent hover:shadow-border/20 [a&]:hover:bg-accent/10 [a&]:hover:text-accent-foreground",
        success:
          "border-green-300 bg-green-100 text-green-800 dark:border-green-600 dark:bg-green-900/20 dark:text-green-200 shadow-green-100/30 hover:shadow-green-100/40 dark:shadow-green-900/20 dark:hover:shadow-green-900/30 [a&]:hover:bg-green-200 dark:[a&]:hover:bg-green-900/30 focus-visible:ring-green-500/40 dark:focus-visible:ring-green-400/50",
        warning:
          "border-yellow-300 bg-yellow-100 text-yellow-800 dark:border-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-200 shadow-yellow-100/30 hover:shadow-yellow-100/40 dark:shadow-yellow-900/20 dark:hover:shadow-yellow-900/30 [a&]:hover:bg-yellow-200 dark:[a&]:hover:bg-yellow-900/30 focus-visible:ring-yellow-500/40 dark:focus-visible:ring-yellow-400/50",
        info:
          "border-blue-300 bg-blue-100 text-blue-800 dark:border-blue-600 dark:bg-blue-900/20 dark:text-blue-200 shadow-blue-100/30 hover:shadow-blue-100/40 dark:shadow-blue-900/20 dark:hover:shadow-blue-900/30 [a&]:hover:bg-blue-200 dark:[a&]:hover:bg-blue-900/30 focus-visible:ring-blue-500/40 dark:focus-visible:ring-blue-400/50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }