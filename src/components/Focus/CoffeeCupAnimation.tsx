import { motion } from 'framer-motion';

interface CoffeeCupAnimationProps {
  fillPercent: number; // 0-100
  mode: 'draining' | 'filling'; // work session vs break
  isAnimating: boolean;
}

export function CoffeeCupAnimation({ fillPercent, mode, isAnimating }: CoffeeCupAnimationProps) {
  // Couleur du liquide selon le mode
  const fillColor = mode === 'draining' ? '#6F4E37' : '#9CCC65'; // café marron vs thé vert
  const fillColorDark = mode === 'draining' ? '#4A3326' : '#7CB342'; // couleur plus foncée pour le gradient

  // Coordonnées réelles de la zone UTILISABLE de la tasse
  // En analysant le clipPath: "M 50 80 Q 48 150 55 200 Q 58 220 90 230 L 110 230 Q 142 220 145 200 Q 152 150 150 80 Z"
  // Le fond réel (point le plus bas du liquide visible) est vers Y=220 (pas 230 à cause des courbes)
  // Le haut réel (surface du liquide au max) est vers Y=85 (juste sous le bord elliptique)
  const cupTop = 85;  // Juste sous le bord visible de la tasse
  const cupBottom = 150; // Fond réel de la zone de liquide (avant la courbure du bas)
  const cupHeight = cupBottom - cupTop; // ~135 pixels utilisables

  // Calculer la hauteur du liquide
  const liquidHeight = cupHeight * (fillPercent / 100);
  // Position Y du liquide (commence du bas de la tasse)
  const liquidY = cupBottom - liquidHeight;

  return (
    <svg viewBox="0 0 200 280" className="w-64 h-72 mx-auto drop-shadow-xl">
      {/* Définitions et clipPath pour le liquide */}
      <defs>
        {/* ClipPath pour le corps de la tasse */}
        <clipPath id="cup-clip">
          <path d="M 50 80 Q 48 150 55 200 Q 58 220 90 230 L 110 230 Q 142 220 145 200 Q 152 150 150 80 Z" />
        </clipPath>

        {/* Gradient vertical pour effet de profondeur du liquide */}
        <linearGradient id="liquid-gradient-vertical" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={fillColor} stopOpacity="0.9" />
          <stop offset="100%" stopColor={fillColorDark} stopOpacity="1" />
        </linearGradient>

        {/* Gradient horizontal pour reflet sur le liquide */}
        <linearGradient id="liquid-shine" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="white" stopOpacity="0" />
          <stop offset="30%" stopColor="white" stopOpacity="0.3" />
          <stop offset="70%" stopColor="white" stopOpacity="0.3" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>

        {/* Gradient pour la tasse (effet 3D) */}
        <linearGradient id="cup-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.15" />
          <stop offset="40%" stopColor="currentColor" stopOpacity="0.25" />
          <stop offset="60%" stopColor="currentColor" stopOpacity="0.25" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.15" />
        </linearGradient>

        {/* Gradient pour le reflet sur la tasse */}
        <linearGradient id="cup-shine" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="white" stopOpacity="0" />
          <stop offset="20%" stopColor="white" stopOpacity="0.4" />
          <stop offset="40%" stopColor="white" stopOpacity="0" />
        </linearGradient>

        {/* Filtre pour l'ombre portée */}
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
          <feOffset dx="2" dy="4" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.3"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>

        {/* Filtre pour le flou de vapeur */}
        <filter id="steam-blur">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" />
        </filter>
      </defs>

      {/* Ombre portée de la tasse */}
      <ellipse
        cx="100"
        cy="235"
        rx="35"
        ry="8"
        fill="currentColor"
        className="text-muted/20"
      />

      {/* Groupe de la tasse avec filtre d'ombre */}
      <g filter="url(#shadow)">
        {/* Corps de la tasse rempli (effet 3D) */}
        <path
          d="M 50 80 Q 48 150 55 200 Q 58 220 90 230 L 110 230 Q 142 220 145 200 Q 152 150 150 80 Z"
          fill="url(#cup-gradient)"
          className="text-foreground"
        />

        {/* Liquide animé avec vagues */}
        <g clipPath="url(#cup-clip)">
          {/* Liquide principal */}
          <motion.rect
            x="40"
            y={liquidY}
            width="120"
            height={liquidHeight}
            fill="url(#liquid-gradient-vertical)"
            initial={false}
            animate={{ y: liquidY, height: liquidHeight }}
            transition={{
              duration: 1.2,
              ease: [0.4, 0, 0.2, 1] // cubic-bezier pour une animation plus naturelle
            }}
          />

          {/* Vagues à la surface (seulement si en mouvement) */}
          {isAnimating && fillPercent > 5 && (
            <motion.path
              d={`M 40 ${liquidY} Q 65 ${liquidY - 3} 90 ${liquidY} T 160 ${liquidY}`}
              fill="none"
              stroke="white"
              strokeWidth="1.5"
              strokeOpacity="0.4"
              initial={false}
              animate={{
                y: liquidY,
                d: [
                  `M 40 ${liquidY} Q 65 ${liquidY - 3} 90 ${liquidY} T 160 ${liquidY}`,
                  `M 40 ${liquidY} Q 65 ${liquidY + 3} 90 ${liquidY} T 160 ${liquidY}`,
                  `M 40 ${liquidY} Q 65 ${liquidY - 3} 90 ${liquidY} T 160 ${liquidY}`,
                ]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          )}

          {/* Reflet sur le liquide */}
          <motion.rect
            x="55"
            y={liquidY + 10}
            width="30"
            height={Math.max(0, liquidHeight - 20)}
            fill="url(#liquid-shine)"
            initial={false}
            animate={{ y: liquidY + 10, height: Math.max(0, liquidHeight - 20) }}
            transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
          />

          {/* Bulles pour le mode remplissage */}
          {mode === 'filling' && isAnimating && fillPercent > 10 && (
            <>
              {[0, 1, 2].map((i) => (
                <motion.circle
                  key={`bubble-${i}`}
                  cx={70 + i * 20}
                  cy={cupBottom}
                  r="3"
                  fill="white"
                  fillOpacity="0.5"
                  initial={{ cy: cupBottom, opacity: 0 }}
                  animate={{
                    cy: [cupBottom, liquidY + 20],
                    opacity: [0, 0.6, 0.4, 0],
                    r: [2, 3, 4, 3],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    delay: i * 0.6,
                    ease: "easeOut",
                  }}
                />
              ))}
            </>
          )}
        </g>

        {/* Contour de la tasse */}
        <path
          d="M 50 80 Q 48 150 55 200 Q 58 220 90 230 L 110 230 Q 142 220 145 200 Q 152 150 150 80 Z"
          fill="transparent"
          stroke="currentColor"
          strokeWidth="3.5"
          className="text-foreground/40"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Reflet lumineux sur la tasse (gauche) */}
        <path
          d="M 55 90 Q 53 140 58 190"
          fill="transparent"
          stroke="url(#cup-shine)"
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* Bord de la tasse (ellipse en haut) */}
        <ellipse
          cx="100"
          cy="75"
          rx="50"
          ry="8"
          fill="url(#cup-gradient)"
          className="text-foreground"
        />

        {/* Contour du bord */}
        <ellipse
          cx="100"
          cy="75"
          rx="50"
          ry="8"
          fill="transparent"
          stroke="currentColor"
          strokeWidth="3.5"
          className="text-foreground/40"
        />

        {/* Reflet sur le bord */}
        <ellipse
          cx="100"
          cy="74"
          rx="45"
          ry="6"
          fill="transparent"
          stroke="white"
          strokeWidth="2"
          strokeOpacity="0.3"
        />

        {/* Poignée */}
        <path
          d="M 150 100 Q 175 100 180 115 Q 185 130 180 145 Q 175 160 150 160"
          fill="transparent"
          stroke="currentColor"
          strokeWidth="3.5"
          className="text-foreground/40"
          strokeLinecap="round"
        />

        {/* Poignée (intérieur pour effet 3D) */}
        <path
          d="M 150 105 Q 172 105 177 117 Q 181 130 177 143 Q 172 155 150 155"
          fill="url(#cup-gradient)"
          className="text-foreground"
        />

        {/* Reflet sur la poignée */}
        <path
          d="M 152 110 Q 165 110 168 120"
          fill="transparent"
          stroke="white"
          strokeWidth="1.5"
          strokeOpacity="0.4"
          strokeLinecap="round"
        />
      </g>

      {/* Vapeur élaborée (seulement si en mouvement et assez de liquide) */}
      {isAnimating && fillPercent > 15 && (
        <g filter="url(#steam-blur)">
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.path
              key={`steam-${i}`}
              d={`M ${70 + i * 15} 65 Q ${75 + i * 15} 50 ${70 + i * 15} 35`}
              fill="transparent"
              stroke="currentColor"
              strokeWidth="2"
              strokeOpacity="0.3"
              strokeLinecap="round"
              className="text-muted-foreground"
              initial={{ opacity: 0, pathLength: 0, y: 0 }}
              animate={{
                opacity: [0, 0.4, 0.3, 0],
                pathLength: [0, 0.8, 1, 1],
                y: [0, -20, -40, -50],
                x: [0, (i % 2 === 0 ? 5 : -5), (i % 2 === 0 ? -3 : 3), 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                delay: i * 0.5,
                ease: "easeOut",
              }}
            />
          ))}

          {/* Particules de vapeur additionnelles */}
          {[0, 1, 2].map((i) => (
            <motion.circle
              key={`vapor-${i}`}
              cx={80 + i * 20}
              cy={65}
              r="4"
              fill="currentColor"
              className="text-muted-foreground/20"
              initial={{ opacity: 0, y: 0, scale: 0.5 }}
              animate={{
                opacity: [0, 0.5, 0.3, 0],
                y: [0, -25, -50, -70],
                scale: [0.5, 1.2, 1.8, 2.5],
                x: [0, (i % 2 === 0 ? 8 : -8), (i % 2 === 0 ? -5 : 5), 0],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                delay: i * 0.7,
                ease: "easeOut",
              }}
            />
          ))}
        </g>
      )}

      {/* Indicateur de remplissage (pourcentage) avec style amélioré */}
      <motion.text
        x="100"
        y="270"
        textAnchor="middle"
        className="text-sm font-bold fill-foreground"
        initial={false}
        animate={{
          opacity: [0.7, 1, 0.7],
          scale: [1, 1.05, 1]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        {Math.round(fillPercent)}%
      </motion.text>

      {/* Sous-texte indicatif */}
      <text
        x="100"
        y="285"
        textAnchor="middle"
        className="text-xs font-medium fill-muted-foreground"
      >
        {mode === 'draining' ? 'Concentration' : 'Recharge'}
      </text>
    </svg>
  );
}
