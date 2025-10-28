export interface Theme {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    accent: string;
    background: string;
    backgroundPattern: string;
    surface: string;
    text: string;
    textMuted: string;
  };
}

export const themes: Theme[] = [
  {
    id: 'default',
    name: 'Défaut',
    description: 'Thème classique clair et propre',
    colors: {
      primary: '#3b82f6',
      primaryLight: '#60a5fa',
      primaryDark: '#2563eb',
      accent: '#8b5cf6',
      background: '#ffffff',
      backgroundPattern: 'linear-gradient(to bottom right, #f8fafc, #e2e8f0)',
      surface: '#ffffff',
      text: '#1f2937',
      textMuted: '#6b7280',
    },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Bleu océan apaisant et frais',
    colors: {
      primary: '#0891b2',
      primaryLight: '#06b6d4',
      primaryDark: '#0e7490',
      accent: '#14b8a6',
      background: '#ecfeff',
      backgroundPattern: 'linear-gradient(135deg, #cffafe 0%, #a5f3fc 50%, #67e8f9 100%)',
      surface: '#ffffff',
      text: '#164e63',
      textMuted: '#0e7490',
    },
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Vert forêt naturel et reposant',
    colors: {
      primary: '#059669',
      primaryLight: '#10b981',
      primaryDark: '#047857',
      accent: '#84cc16',
      background: '#f0fdf4',
      backgroundPattern: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 50%, #86efac 100%)',
      surface: '#ffffff',
      text: '#14532d',
      textMuted: '#166534',
    },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Coucher de soleil chaleureux',
    colors: {
      primary: '#f97316',
      primaryLight: '#fb923c',
      primaryDark: '#ea580c',
      accent: '#f59e0b',
      background: '#fff7ed',
      backgroundPattern: 'linear-gradient(135deg, #fed7aa 0%, #fdba74 50%, #fb923c 100%)',
      surface: '#ffffff',
      text: '#7c2d12',
      textMuted: '#c2410c',
    },
  },
  {
    id: 'lavender',
    name: 'Lavender',
    description: 'Lavande doux et élégant',
    colors: {
      primary: '#8b5cf6',
      primaryLight: '#a78bfa',
      primaryDark: '#7c3aed',
      accent: '#d946ef',
      background: '#faf5ff',
      backgroundPattern: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 50%, #d8b4fe 100%)',
      surface: '#ffffff',
      text: '#581c87',
      textMuted: '#7e22ce',
    },
  },
  {
    id: 'rose',
    name: 'Rose',
    description: 'Rose romantique et doux',
    colors: {
      primary: '#ec4899',
      primaryLight: '#f472b6',
      primaryDark: '#db2777',
      accent: '#f43f5e',
      background: '#fdf2f8',
      backgroundPattern: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 50%, #f9a8d4 100%)',
      surface: '#ffffff',
      text: '#831843',
      textMuted: '#be185d',
    },
  },
];

export const getTheme = (themeId: string): Theme => {
  return themes.find((t) => t.id === themeId) || themes[0];
};
