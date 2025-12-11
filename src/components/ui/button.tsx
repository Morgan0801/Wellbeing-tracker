import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'glow' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'xl' | 'icon'
  rounded?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', rounded = false, loading = false, children, disabled, ...props }, ref) => {

    const baseStyles = `
      inline-flex items-center justify-center font-medium
      transition-all duration-200 ease-out
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background
      disabled:pointer-events-none disabled:opacity-50
      select-none
      active:scale-[0.98]
    `

    const variants = {
      default: `
        bg-primary text-primary-foreground
        hover:bg-primary/90 hover:shadow-soft-md hover:-translate-y-0.5
        shadow-soft-sm
        active:translate-y-0 active:shadow-soft-sm
      `,
      secondary: `
        bg-secondary text-secondary-foreground
        hover:bg-secondary/80 hover:shadow-soft-sm
        border border-transparent
      `,
      outline: `
        border-2 border-border bg-transparent text-foreground
        hover:bg-muted/50 hover:border-primary/30
      `,
      ghost: `
        bg-transparent text-foreground
        hover:bg-muted/70
      `,
      destructive: `
        bg-destructive/10 text-destructive border border-destructive/20
        hover:bg-destructive/20 hover:border-destructive/30
      `,
      glow: `
        bg-gradient-to-r from-primary to-vitality text-white
        shadow-glow hover:shadow-[0_0_50px_-10px_rgba(91,171,138,0.4)]
        hover:-translate-y-1
        active:translate-y-0
      `,
      link: `
        text-primary underline-offset-4 hover:underline
        bg-transparent p-0 h-auto
      `,
    }

    const sizes = {
      default: "h-9 px-4 py-2 text-sm gap-1.5 rounded-lg",
      sm: "h-8 px-3 py-1.5 text-xs gap-1 rounded-lg",
      lg: "h-10 px-6 py-2.5 text-sm gap-2 rounded-lg",
      xl: "h-11 px-8 py-3 text-base gap-2.5 rounded-xl",
      icon: "h-9 w-9 rounded-lg p-0",
    }

    const isDisabled = disabled || loading

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          rounded && "!rounded-full",
          loading && "cursor-wait",
          className
        )}
        disabled={isDisabled}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

// Variante pour les boutons icône uniquement
interface IconButtonProps extends ButtonProps {
  'aria-label': string
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        size="icon"
        variant="ghost"
        className={cn("flex-shrink-0", className)}
        {...props}
      />
    )
  }
)
IconButton.displayName = "IconButton"

export { Button, IconButton }
