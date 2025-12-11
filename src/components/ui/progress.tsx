import * as React from 'react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  max?: number
  variant?: 'default' | 'gradient' | 'mood' | 'vitality' | 'sleep' | 'productivity' | 'focus' | 'gratitude'
  size?: 'sm' | 'default' | 'lg'
  showValue?: boolean
  animated?: boolean
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, variant = 'default', size = 'default', showValue = false, animated = true, ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

    const sizes = {
      sm: "h-2",
      default: "h-3",
      lg: "h-4",
    }

    const variants = {
      default: "bg-primary",
      gradient: "bg-gradient-to-r from-primary via-vitality to-primary",
      mood: "bg-gradient-to-r from-mood/80 to-mood",
      vitality: "bg-gradient-to-r from-vitality/80 to-vitality",
      sleep: "bg-gradient-to-r from-sleep/80 to-sleep",
      productivity: "bg-gradient-to-r from-productivity/80 to-productivity",
      focus: "bg-gradient-to-r from-focus/80 to-focus",
      gratitude: "bg-gradient-to-r from-gratitude/80 to-gratitude",
    }

    return (
      <div className={cn("relative", showValue && "flex items-center gap-3")}>
        <div
          ref={ref}
          className={cn(
            'relative w-full overflow-hidden rounded-full bg-muted/50',
            sizes[size],
            className
          )}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          {...props}
        >
          {animated ? (
            <motion.div
              className={cn("h-full rounded-full", variants[variant])}
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          ) : (
            <div
              className={cn("h-full rounded-full transition-all duration-300", variants[variant])}
              style={{ width: `${percentage}%` }}
            />
          )}

          {/* Effet shimmer optionnel */}
          {percentage > 0 && percentage < 100 && (
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"
              style={{ backgroundSize: '200% 100%' }}
            />
          )}
        </div>

        {showValue && (
          <span className="text-xs font-medium text-muted-foreground min-w-[3ch] text-right">
            {Math.round(percentage)}%
          </span>
        )}
      </div>
    )
  }
)

Progress.displayName = 'Progress'

// Progress circulaire
export interface CircularProgressProps {
  value?: number
  max?: number
  size?: number
  strokeWidth?: number
  variant?: 'default' | 'mood' | 'vitality' | 'sleep' | 'productivity' | 'focus' | 'gratitude'
  showValue?: boolean
  children?: React.ReactNode
  className?: string
}

const CircularProgress = React.forwardRef<SVGSVGElement, CircularProgressProps>(
  ({ value = 0, max = 100, size = 120, strokeWidth = 8, variant = 'default', showValue = false, children, className }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const offset = circumference - (percentage / 100) * circumference

    const colors = {
      default: 'stroke-primary',
      mood: 'stroke-mood',
      vitality: 'stroke-vitality',
      sleep: 'stroke-sleep',
      productivity: 'stroke-productivity',
      focus: 'stroke-focus',
      gratitude: 'stroke-gratitude',
    }

    return (
      <div className={cn("relative inline-flex items-center justify-center", className)}>
        <svg
          ref={ref}
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            className="stroke-muted/30"
          />
          {/* Progress circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className={colors[variant]}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            style={{
              strokeDasharray: circumference,
            }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex items-center justify-center">
          {children ? (
            children
          ) : showValue ? (
            <span className="font-display text-2xl font-bold text-foreground">
              {Math.round(percentage)}%
            </span>
          ) : null}
        </div>
      </div>
    )
  }
)

CircularProgress.displayName = 'CircularProgress'

export { Progress, CircularProgress }
