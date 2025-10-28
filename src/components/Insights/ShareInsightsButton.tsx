import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Download, Check } from 'lucide-react';
import html2canvas from 'html2canvas';
import { motion, AnimatePresence } from 'framer-motion';

interface ShareInsightsButtonProps {
  targetId: string;
  filename?: string;
}

export function ShareInsightsButton({ targetId, filename = 'wellbeing-insights' }: ShareInsightsButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const generateImage = async () => {
    setIsGenerating(true);
    setIsSuccess(false);

    try {
      const element = document.getElementById(targetId);
      if (!element) {
        throw new Error('Element not found');
      }

      // Configuration html2canvas
      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2, // Haute qualité
        logging: false,
        useCORS: true,
        allowTaint: true,
      });

      // Convertir en blob
      canvas.toBlob((blob) => {
        if (!blob) return;

        // Télécharger l'image
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        // Animation de succès
        setIsSuccess(true);
        setTimeout(() => setIsSuccess(false), 2000);
      }, 'image/png');
    } catch (error) {
      console.error('Error generating image:', error);
      alert('Erreur lors de la génération de l\'image');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
      <Button
        onClick={generateImage}
        disabled={isGenerating || isSuccess}
        className="gap-2"
        variant={isSuccess ? 'default' : 'outline'}
      >
        <AnimatePresence mode="wait">
          {isSuccess ? (
            <motion.div
              key="success"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <Check className="w-4 h-4" />
            </motion.div>
          ) : (
            <motion.div
              key="share"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              {isGenerating ? (
                <Download className="w-4 h-4 animate-bounce" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
            </motion.div>
          )}
        </AnimatePresence>
        <span className="text-sm">
          {isGenerating ? 'Génération...' : isSuccess ? 'Téléchargé !' : 'Partager'}
        </span>
      </Button>
    </motion.div>
  );
}
