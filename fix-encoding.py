# -*- coding: utf-8 -*-
import os

file_path = os.path.join('src', 'components', 'Insights', 'InsightsPage.tsx')

# Lire le fichier
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Corrections des emojis et accents
replacements = {
    # Emojis
    '\udff0\udffc': '💼',
    '\udff0\udfc3': '🏃',
    '\udfa4\udff8': '❤️',
    '\udff0\udfa5': '👥',
    '\udff0\udfa8\udf80\udff0\udfp3\udf80\udff0\udfr0': '👨‍👩‍👧',
    '\udff0\udff1': '💰',
    '\udfgf\udffe': '🎮',
    '\udff0\udf9°': '🧘',
    '\udff0\udfa1': '💡',
    '\udff\udff\udf\udff\udff': '✨',
    '\udff0\udf´': '😴',
    '\udfdf\udfgs': '🎯',
    '\ufdf\udff ': '⚠️',

    # Accents français
    'Ã©': 'é',
    'Ã¨': 'è',
    'Ãª': 'ê',
    'Ã ': 'à',
    'Ã®': 'î',
    'Ã´': 'ô',
    'Ã§': 'ç',
    'Ã¹': 'ù',
    'Ã»': 'û',
    'Ã‰': 'É',
    'Ã€': 'À'
}

# Appliquer les remplacements
for bad, good in replacements.items():
    content = content.replace(bad, good)

# Écrire le fichier
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('✅ Fichier corrigé !')
