"use client"
import type * as React from "react"

import { cn } from "@/lib/utils"

function clampProgressValue(value: number) {
  if (Number.isNaN(value)) return 0
  return Math.min(100, Math.max(0, value))
}

function Progress({
  className,
  value,
  style,
  ...props
}: React.ComponentProps<"div"> & { value?: number }) {
  const safeValue = clampProgressValue(Number(value ?? 0))
  const trackStyle: React.CSSProperties = {
    backgroundColor: "color-mix(in srgb, var(--border-muted) 70%, transparent)",
    ...style,
  }
  const indicatorStyle: React.CSSProperties = {
    width: `${safeValue}%`,
    backgroundColor: "var(--brand-primary)",
  }

  return (
    <div
      data-slot="progress"
      role="progressbar"
      aria-valuenow={safeValue}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("relative h-2 w-full overflow-hidden rounded-full", className)}
      style={trackStyle}
      {...props}
    >
      <div
        data-slot="progress-indicator"
        className="h-full rounded-full transition-[width] duration-300 ease-out"
        style={indicatorStyle}
      />
    </div>
  )
}

function ProgressTrack({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "relative flex h-1 w-full items-center overflow-x-hidden rounded-full bg-muted",
        className
      )}
      data-slot="progress-track"
      {...props}
    />
  )
}

function ProgressIndicator({
  className,
  style,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="progress-indicator"
      className={cn("h-full bg-primary transition-all", className)}
      style={style}
      {...props}
    />
  )
}

function ProgressLabel({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn("text-sm font-medium", className)}
      data-slot="progress-label"
      {...props}
    />
  )
}

function ProgressValue({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "ml-auto text-sm text-muted-foreground tabular-nums",
        className
      )}
      data-slot="progress-value"
      {...props}
    />
  )
}

export {
  Progress,
  ProgressTrack,
  ProgressIndicator,
  ProgressLabel,
  ProgressValue,
}
