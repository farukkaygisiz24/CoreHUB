"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glowEffect?: boolean
  /** false = içerik kadar yükseklik (iç içe kartlarda h-full uzamasını önler) */
  fillHeight?: boolean
  children: React.ReactNode
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, glowEffect = true, fillHeight = true, children, ...props }, ref) => {
    return (
      <div className={cn("relative", fillHeight && "h-full")}>
        {glowEffect && (
          <div className="absolute -inset-1 rounded-2xl bg-linear-to-r from-cyan-500/30 via-blue-500/30 to-purple-500/30 blur-xl opacity-70 dark:from-cyan-500/15 dark:via-indigo-500/10 dark:to-purple-500/15 dark:opacity-50" />
        )}
        <div
          ref={ref}
          className={cn(
            "relative flex flex-col rounded-2xl border border-black/10",
            fillHeight && "h-full",
            "bg-black/[0.04] backdrop-blur-xl",
            "shadow-[0_8px_32px_rgba(0,0,0,0.08)]",
            "dark:border-white/20 dark:bg-white/10",
            "dark:shadow-[0_8px_32px_rgba(0,0,0,0.37)]",
            "before:absolute before:inset-0 before:rounded-2xl",
            "before:bg-linear-to-b before:from-white/20 before:to-transparent before:pointer-events-none",
            "dark:before:from-white/[0.06] dark:before:to-transparent",
            "after:absolute after:inset-px after:rounded-[calc(1rem-1px)]",
            "after:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] after:pointer-events-none",
            "dark:after:shadow-[inset_0_1px_1px_rgba(255,255,255,0.04)]",
            className,
          )}
          {...props}
        >
          <div className={cn("relative z-10 flex flex-col", fillHeight && "h-full")}>{children}</div>
        </div>
      </div>
    )
  },
)
GlassCard.displayName = "GlassCard"

const GlassCardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("flex flex-col gap-1.5 p-6", className)} {...props} />,
)
GlassCardHeader.displayName = "GlassCardHeader"

const GlassCardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-xl font-semibold text-white leading-none tracking-tight", className)}
      {...props}
    />
  ),
)
GlassCardTitle.displayName = "GlassCardTitle"

const GlassCardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => <p ref={ref} className={cn("text-sm text-white/60", className)} {...props} />,
)
GlassCardDescription.displayName = "GlassCardDescription"

const GlassCardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />,
)
GlassCardContent.displayName = "GlassCardContent"

const GlassCardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  ),
)
GlassCardFooter.displayName = "GlassCardFooter"

export { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardDescription, GlassCardContent, GlassCardFooter }
