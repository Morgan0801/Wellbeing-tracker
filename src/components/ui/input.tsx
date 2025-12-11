import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  error?: boolean
  hint?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, iconPosition = 'left', error, hint, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {icon && iconPosition === 'left' && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            {icon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            `flex h-12 w-full rounded-xl border-2 bg-card px-4 py-3
            text-sm text-foreground font-medium
            placeholder:text-muted-foreground/60
            transition-all duration-200 ease-out
            focus-visible:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10
            hover:border-border/80
            disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/50
            file:border-0 file:bg-transparent file:text-sm file:font-medium`,
            error
              ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/10"
              : "border-border",
            icon && iconPosition === 'left' && "pl-12",
            icon && iconPosition === 'right' && "pr-12",
            className
          )}
          ref={ref}
          {...props}
        />
        {icon && iconPosition === 'right' && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            {icon}
          </div>
        )}
        {hint && (
          <p className={cn(
            "mt-1.5 text-xs",
            error ? "text-destructive" : "text-muted-foreground"
          )}>
            {hint}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

// Textarea avec le même style
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
  hint?: string
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, hint, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <textarea
          className={cn(
            `flex min-h-[120px] w-full rounded-xl border-2 bg-card px-4 py-3
            text-sm text-foreground font-medium
            placeholder:text-muted-foreground/60
            transition-all duration-200 ease-out
            focus-visible:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10
            hover:border-border/80
            disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/50
            resize-none`,
            error
              ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/10"
              : "border-border",
            className
          )}
          ref={ref}
          {...props}
        />
        {hint && (
          <p className={cn(
            "mt-1.5 text-xs",
            error ? "text-destructive" : "text-muted-foreground"
          )}>
            {hint}
          </p>
        )}
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

// Label stylisé
export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, children, required, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          "text-sm font-medium text-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
          className
        )}
        {...props}
      >
        {children}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
    )
  }
)
Label.displayName = "Label"

export { Input, Textarea, Label }
