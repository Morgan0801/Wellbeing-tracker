import * as React from "react"
import { cn } from "@/lib/utils"
import { motion, HTMLMotionProps } from "framer-motion"

type GradientType = 'sunrise' | 'ocean' | 'forest' | 'twilight' | 'sunset' | 'night'

interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onAnimationStart' | 'onDrag' | 'onDragEnd' | 'onDragStart'> {
  variant?: 'default' | 'glass' | 'elevated' | 'outline' | 'gradient' | 'flat'
  hover?: boolean
  gradient?: GradientType
  padding?: 'none' | 'sm' | 'default' | 'lg'
}

const gradientClasses: Record<GradientType, string> = {
  sunrise: "gradient-sunrise",
  ocean: "gradient-ocean",
  forest: "gradient-forest",
  twilight: "gradient-twilight",
  sunset: "gradient-sunset",
  night: "gradient-night",
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', hover = false, gradient, padding = 'default', children, ...props }, ref) => {

    const baseStyles = "rounded-2xl transition-all duration-300"

    const variants = {
      default: `
        bg-card border border-border/50
        shadow-soft-sm
      `,
      glass: `
        bg-card/70 dark:bg-card/60
        backdrop-blur-md
        border border-white/20 dark:border-white/10
        shadow-glass
      `,
      elevated: `
        bg-card border-0
        shadow-soft-lg
      `,
      outline: `
        bg-transparent border-2 border-dashed border-border
      `,
      gradient: `
        border-0
        ${gradient ? gradientClasses[gradient] : 'gradient-forest'}
      `,
      flat: `
        bg-muted/30 border-0
      `,
    }

    const paddings = {
      none: "",
      sm: "p-2 md:p-3",
      default: "p-3 md:p-4",
      lg: "p-4 md:p-5",
    }

    const hoverStyles = hover
      ? "hover:-translate-y-1 hover:shadow-soft-xl cursor-pointer active:translate-y-0 active:shadow-soft-lg"
      : ""

    if (hover) {
      return (
        <motion.div
          ref={ref as React.Ref<HTMLDivElement>}
          whileHover={{ y: -4 }}
          whileTap={{ y: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className={cn(
            baseStyles,
            variants[variant],
            paddings[padding],
            "cursor-pointer",
            className
          )}
          {...(props as HTMLMotionProps<"div">)}
        >
          {children}
        </motion.div>
      )
    }

    return (
      <div
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          paddings[padding],
          hoverStyles,
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1 p-4 pb-2", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "font-display text-lg font-bold tracking-tight text-foreground",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground leading-relaxed", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-4 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-4 pt-3 border-t border-border/30", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

// Card avec icône et couleur sémantique
interface FeatureCardProps extends CardProps {
  icon?: React.ReactNode
  iconBg?: string
  title?: string
  description?: string
  value?: string | number
  trend?: 'up' | 'down' | 'neutral'
  onClick?: () => void
}

const FeatureCard = React.forwardRef<HTMLDivElement, FeatureCardProps>(
  ({ icon, iconBg = "bg-primary/10", title, description, value, trend, onClick, className, children, ...props }, ref) => {
    return (
      <Card
        ref={ref}
        hover={!!onClick}
        onClick={onClick}
        className={cn("overflow-hidden", className)}
        {...props}
      >
        <div className="p-3 md:p-4">
          {/* Header avec icône */}
          {(icon || title) && (
            <div className="flex items-start justify-between mb-3">
              {icon && (
                <div className={cn("p-2.5 rounded-xl", iconBg)}>
                  {icon}
                </div>
              )}
              {trend && (
                <div className={cn(
                  "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
                  trend === 'up' && "bg-vitality/10 text-vitality",
                  trend === 'down' && "bg-destructive/10 text-destructive",
                  trend === 'neutral' && "bg-muted text-muted-foreground"
                )}>
                  {trend === 'up' && '↑'}
                  {trend === 'down' && '↓'}
                  {trend === 'neutral' && '→'}
                </div>
              )}
            </div>
          )}

          {/* Value */}
          {value !== undefined && (
            <div className="mb-1">
              <span className="text-2xl md:text-3xl font-display font-bold text-foreground">
                {value}
              </span>
            </div>
          )}

          {/* Title & Description */}
          {title && (
            <p className="text-sm font-medium text-foreground/80 mb-0.5">{title}</p>
          )}
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}

          {/* Custom children */}
          {children}
        </div>
      </Card>
    )
  }
)
FeatureCard.displayName = "FeatureCard"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, FeatureCard }
