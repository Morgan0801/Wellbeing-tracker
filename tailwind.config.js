/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1200px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Nunito', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        // Couleurs de base
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          warm: "hsl(var(--accent-warm))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        // Couleurs sémantiques Wellness
        mood: {
          DEFAULT: "hsl(var(--mood))",
          light: "hsl(var(--mood-light))",
          foreground: "hsl(var(--mood-foreground))",
        },
        vitality: {
          DEFAULT: "hsl(var(--vitality))",
          light: "hsl(var(--vitality-light))",
          foreground: "hsl(var(--vitality-foreground))",
        },
        sleep: {
          DEFAULT: "hsl(var(--sleep))",
          light: "hsl(var(--sleep-light))",
          foreground: "hsl(var(--sleep-foreground))",
        },
        productivity: {
          DEFAULT: "hsl(var(--productivity))",
          light: "hsl(var(--productivity-light))",
          foreground: "hsl(var(--productivity-foreground))",
        },
        focus: {
          DEFAULT: "hsl(var(--focus))",
          light: "hsl(var(--focus-light))",
          foreground: "hsl(var(--focus-foreground))",
        },
        gratitude: {
          DEFAULT: "hsl(var(--gratitude))",
          light: "hsl(var(--gratitude-light))",
          foreground: "hsl(var(--gratitude-foreground))",
        },

        // Couleurs naturelles étendues
        sage: {
          50: '#F5F9F7',
          100: '#E8F3ED',
          200: '#C5E2D3',
          300: '#9DCDB5',
          400: '#75B898',
          500: '#5BAB8A',
          600: '#4A9272',
          700: '#3D7A5F',
          800: '#33634E',
          900: '#2A5241',
        },
        sand: {
          50: '#FDFBF7',
          100: '#F9F5ED',
          200: '#F0E8D8',
          300: '#E5D8C0',
          400: '#D9C8A8',
          500: '#CCB890',
          600: '#B5A078',
          700: '#9A8762',
          800: '#7F6E50',
          900: '#655840',
        },
        blush: {
          50: '#FDF5F5',
          100: '#FCE8E9',
          200: '#F9CDD0',
          300: '#F4ABB0',
          400: '#EFA3A8',
          500: '#E88B91',
          600: '#D96B72',
          700: '#C54D55',
          800: '#A63D44',
          900: '#863238',
        },
        lavender: {
          50: '#F8F7FC',
          100: '#F0EEF8',
          200: '#E0DCF1',
          300: '#C9C2E6',
          400: '#ADA1D9',
          500: '#9182CC',
          600: '#7666B8',
          700: '#5F519A',
          800: '#4D427D',
          900: '#3F3666',
        },
      },

      borderRadius: {
        'sm': "var(--radius-sm)",
        DEFAULT: "var(--radius)",
        'md': "var(--radius)",
        'lg': "var(--radius-lg)",
        'xl': "var(--radius-xl)",
        '2xl': "var(--radius-2xl)",
        '3xl': "2.5rem",
      },

      boxShadow: {
        'soft-sm': 'var(--shadow-sm)',
        'soft-md': 'var(--shadow-md)',
        'soft-lg': 'var(--shadow-lg)',
        'soft-xl': 'var(--shadow-xl)',
        'glow': 'var(--shadow-glow)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.04)',
      },

      backdropBlur: {
        'xs': '2px',
      },

      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "breathe": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.02)" },
        },
        "slide-up": {
          "0%": { transform: "translateY(16px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "slide-down": {
          "0%": { transform: "translateY(-16px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "slide-in-left": {
          "0%": { transform: "translateX(-100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "spin-slow": {
          "from": { transform: "rotate(0deg)" },
          "to": { transform: "rotate(360deg)" },
        },
        "bounce-soft": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
        "wiggle": {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
      },

      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "float": "float 4s ease-in-out infinite",
        "pulse-soft": "pulse-soft 3s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
        "breathe": "breathe 4s ease-in-out infinite",
        "slide-up": "slide-up 0.4s ease-out",
        "slide-down": "slide-down 0.4s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "slide-in-left": "slide-in-left 0.3s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "spin-slow": "spin-slow 8s linear infinite",
        "bounce-soft": "bounce-soft 2s ease-in-out infinite",
        "wiggle": "wiggle 0.5s ease-in-out",
      },

      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },

      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
