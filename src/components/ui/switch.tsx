import * as React from "react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface SwitchProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  className?: string
  size?: 'sm' | 'default' | 'lg'
  disabled?: boolean
  variant?: 'default' | 'gradient'
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked, onCheckedChange, className, size = 'default', disabled = false, variant = 'default' }, ref) => {

    const sizes = {
      sm: {
        track: "h-5 w-9",
        thumb: "h-4 w-4",
        translate: 16,
      },
      default: {
        track: "h-7 w-12",
        thumb: "h-5 w-5",
        translate: 20,
      },
      lg: {
        track: "h-8 w-14",
        thumb: "h-6 w-6",
        translate: 24,
      },
    }

    const sizeConfig = sizes[size]

    const variants = {
      default: checked ? "bg-primary" : "bg-muted",
      gradient: checked ? "bg-gradient-to-r from-primary to-vitality" : "bg-muted",
    }

    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onCheckedChange(!checked)}
        className={cn(
          `relative inline-flex shrink-0 cursor-pointer items-center rounded-full
          transition-colors duration-300 ease-out
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background
          disabled:cursor-not-allowed disabled:opacity-50`,
          sizeConfig.track,
          variants[variant],
          className
        )}
      >
        <motion.span
          className={cn(
            "pointer-events-none block rounded-full bg-white shadow-soft-md",
            sizeConfig.thumb
          )}
          animate={{
            x: checked ? sizeConfig.translate : 2,
          }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </button>
    )
  }
)
Switch.displayName = "Switch"

// Switch avec label intégré
interface LabeledSwitchProps extends SwitchProps {
  label?: string
  description?: string
}

const LabeledSwitch = React.forwardRef<HTMLButtonElement, LabeledSwitchProps>(
  ({ label, description, className, ...props }, ref) => {
    return (
      <div className={cn("flex items-center justify-between gap-4", className)}>
        {(label || description) && (
          <div className="flex flex-col gap-0.5">
            {label && (
              <span className="text-sm font-medium text-foreground">{label}</span>
            )}
            {description && (
              <span className="text-xs text-muted-foreground">{description}</span>
            )}
          </div>
        )}
        <Switch ref={ref} {...props} />
      </div>
    )
  }
)
LabeledSwitch.displayName = "LabeledSwitch"

export { Switch, LabeledSwitch }
