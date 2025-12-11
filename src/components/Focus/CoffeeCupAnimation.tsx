import { motion } from 'framer-motion';

interface CoffeeCupAnimationProps {
  fillPercent: number; // 0-100
  mode: 'draining' | 'filling'; // work session vs break
  isAnimating: boolean;
}

export function CoffeeCupAnimation({ fillPercent, mode, isAnimating }: CoffeeCupAnimationProps) {
  // Couleur du liquide selon le mode
  const fillColor = mode === 'draining' ? '#6F4E37' : '#9CCC65'; // café marron vs thé vert

  // Calculer la position Y du liquide (0 = plein, 150 = vide)
  const liquidY = 80 + (150 * (1 - fillPercent / 100));

  return (
    <svg viewBox="0 0 200 240" className="w-64 h-64 mx-auto">
      {/* Définitions et clipPath pour le liquide */}
      <defs>
        <clipPath id="cup-clip">
          <path d="M 50 80 Q 48 150 55 200 Q 58 220 90 230 L 110 230 Q 142 220 145 200 Q 152 150 150 80 Z" />
        </clipPath>

        {/* Gradient pour effet de profondeur du liquide */}
        <linearGradient id="liquid-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={fillColor} stopOpacity="0.8" />
          <stop offset="50%" stopColor={fillColor} stopOpacity="1" />
          <stop offset="100%" stopColor={fillColor} stopOpacity="0.8" />
        </linearGradient>
      </defs>

      {/* Corps de la tasse (contour) */}
      <path
        d="M 50 80 Q 48 150 55 200 Q 58 220 90 230 L 110 230 Q 142 220 145 200 Q 152 150 150 80 Z"
        fill="transparent"
        stroke="currentColor"
        strokeWidth="4"
        className="text-muted/30"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Bord de la tasse */}
      <path
        d="M 50 80 Q 50 70 100 70 Q 150 70 150 80"
        fill="transparent"
        stroke="currentColor"
        strokeWidth="4"
        className="text-muted/30"
        strokeLinecap="round"
      />

      {/* Poignée */}
      <path
        d="M 150 100 Q 175 100 180 115 Q 185 130 180 145 Q 175 160 150 160"
        fill="transparent"
        stroke="currentColor"
        strokeWidth="4"
        className="text-muted/30"
        strokeLinecap="round"
      />

      {/* Liquide animé */}
      <motion.rect
        x="40"
        y="70"
        width="120"
        height="170"
        fill="url(#liquid-gradient)"
        clipPath="url(#cup-clip)"
        initial={false}
        animate={{ y: liquidY }}
        transition={{ duration: 1, ease: "easeInOut" }}
      />

      {/* Effet de surface du liquide (vague subtile) */}
      {fillPercent > 5 && (
        <motion.ellipse
          cx="100"
          cy={liquidY + 5}
          rx="50"
          ry="3"
          fill={fillColor}
          opacity="0.6"
          animate={isAnimating ? {
            ry: [3, 4, 3],
          } : {}}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          clipPath="url(#cup-clip)"
        />
      )}

      {/* Particules de vapeur (seulement si animating et assez de liquide) */}
      {isAnimating && fillPercent > 20 && (
        <>
          {[0, 1, 2].map((i) => (
            <motion.g key={i}>
              {/* Particule de vapeur */}
              <motion.circle
                cx={75 + i * 25}
                cy={50}
                r="2"
                fill="currentColor"
                className="text-muted/40"
                initial={{ opacity: 0, y: 0, scale: 1 }}
                animate={{
                  opacity: [0, 0.8, 0.6, 0],
                  y: [0, -15, -30, -45],
                  scale: [1, 1.2, 1.5, 1.8],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.4,
                  ease: "easeOut",
                }}
              />
            </motion.g>
          ))}
        </>
      )}

      {/* Indicateur de remplissage (pourcentage) */}
      <text
        x="100"
        y="260"
        textAnchor="middle"
        className="text-xs font-medium fill-muted-foreground"
      >
        {Math.round(fillPercent)}%
      </text>
    </svg>
  );
}
