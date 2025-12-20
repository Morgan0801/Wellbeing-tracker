# 🔧 Correctifs Tokens IA - Résumé

## 📊 Problèmes identifiés

### 1. **Réponses tronquées anormalement**
- Insight Quotidien : 14 tokens (au lieu de 400+)
- Reco Habitudes : 19 tokens (au lieu de 500+)
- Corrélations : 79 tokens (au lieu de 2000+)

### 2. **Cause racine**
Les limites `maxOutputTokens` étaient **trop basses** pour les prompts complexes qui demandent du JSON structuré.

---

## ✅ Correctifs appliqués

### 1. **Augmentation des limites de tokens** (×2 à ×4)

| Fonctionnalité | AVANT | APRÈS | Multiplicateur |
|----------------|-------|-------|----------------|
| **Insight Quotidien** | 400 | **1500** | ×3.75 |
| **Corrélations Hebdo** | 2000 | **4000** | ×2 |
| **Soutien Mood Bas** | 300 | **800** | ×2.67 |
| **Résumé Hebdo** | 2000 | **5000** | ×2.5 |
| **Résumé Mensuel** | 3000 | **6000** | ×2 |
| **Affirmation Quotidienne** | 2000 | **4000** | ×2 |
| **Analyse NLP** | 2000 | **4000** | ×2 |
| **Reco Habitudes** | 500 | **1500** | ×3 |
| **Recherche Sémantique** | 500 | **1500** | ×3 |
| **Suggestion Habitude** | 200 | **800** | ×4 |
| **Suggestion Quadrant** | 400 | **1000** | ×2.5 |
| **Conseils Sommeil** | 300 | **1000** | ×3.33 |
| **Encouragement Objectif** | 2000 | **4000** | ×2 |
| **Export Narratif** | 4000 | **8000** | ×2 |
| **Traitement Voix** | 1000 | **2000** | ×2 |
| **Q&A Chatbot** | 2000 | **4000** | ×2 |

### 2. **Logging détaillé ajouté**

Chaque appel API log maintenant :
- 📊 **Usage Metadata** (input/output tokens)
- 🏁 **Finish Reason** (STOP, MAX_TOKENS, etc.)
- ⚙️ **Config maxOutputTokens**
- 📝 **Response Length** (caractères)
- 📄 **Raw Response** (premiers 500 chars)

**Console groups** pour faciliter le debug :
```
🤖 Gemini Response - Insight Quotidien
  📊 Usage Metadata: {...}
  🏁 Finish Reason: STOP
  ⚙️ Config maxOutputTokens: 1500
  📝 Response Length: 342 chars
  📄 Raw Response (first 500 chars): {"insight":"...","tip":"...","emoji":"😊"}
```

### 3. **Alertes améliorées**

Quand une réponse est tronquée (`MAX_TOKENS`), tu verras maintenant :
```
❌ RÉPONSE TRONQUÉE - Insight Quotidien
  Tokens reçus: 14
  Max configuré: 1500
  Longueur texte: 89 chars
```

---

## 🧪 Tests à effectuer

### Test 1 : Rafraîchir le Dashboard
1. **Rafraîchir la page** (F5)
2. Ouvrir la **Console** (F12)
3. Observer les logs `🤖 Gemini Response`
4. Vérifier :
   - ✅ `Finish Reason: STOP` (pas MAX_TOKENS)
   - ✅ Response Length > 100 chars
   - ✅ JSON valide dans Raw Response

### Test 2 : Vérifier l'Insight Quotidien
- L'insight affiché doit être **personnalisé** (pas le fallback "Continue ton excellent travail !")
- Doit contenir emoji + texte + conseil

### Test 3 : Vérifier les Corrélations Hebdo
- Doit afficher 3 corrélations max
- Chaque corrélation avec Impact/Observation/Explication/Action

### Test 4 : Monitoring des tokens
- Ouvrir la carte **"Utilisation API IA"** dans le Dashboard
- Vérifier que les nouveaux appels sont bien loggés
- Export CSV pour analyse détaillée

---

## 📈 Résultat attendu

**AVANT** :
```
🤖 AI Token Usage - Insight Quotidien
📥 Input: 584 tokens
📤 Output: 14 tokens ❌ TRONQUÉ
💰 Cost: $0.000048
```

**APRÈS** :
```
🤖 AI Token Usage - Insight Quotidien
📥 Input: 584 tokens
📤 Output: 245 tokens ✅ COMPLET
💰 Cost: $0.000117
```

---

## 💰 Impact sur les coûts

### Estimation par appel

| Fonctionnalité | Ancien coût | Nouveau coût | Diff |
|----------------|-------------|--------------|------|
| Insight Quotidien | ~$0.00005 | ~$0.00015 | +$0.0001 |
| Corrélations | ~$0.00015 | ~$0.00035 | +$0.0002 |
| Résumé Hebdo | ~$0.00020 | ~$0.00050 | +$0.0003 |

**Coût quotidien estimé** (utilisation normale) :
- AVANT : ~$0.001 / jour (mais réponses tronquées ❌)
- APRÈS : ~$0.003 / jour (réponses complètes ✅)

**Différence** : +$0.06 / mois pour des réponses **complètes et utiles**

---

## 🐛 Debugging

### Si les réponses sont encore tronquées

1. **Console** → Chercher `❌ RÉPONSE TRONQUÉE`
2. Noter la fonctionnalité concernée
3. Vérifier :
   - La longueur du prompt (peut-être trop long)
   - Le `maxOutputTokens` configuré
   - Les données envoyées (trop volumineuses ?)

### Si les logs n'apparaissent pas

Vérifier que `console.group()` est supporté dans ton navigateur (Chrome/Edge/Firefox modernes).

### Si les fallbacks s'affichent encore

Le parsing JSON échoue probablement. Chercher dans la console :
```
Erreur parsing JSON daily insight: ...
```

Vérifier le `Raw Response` pour voir ce que Gemini a réellement retourné.

---

## 🔍 Commandes utiles dans la Console

```javascript
// Voir les stats de tokens
aiTokenLogger.printStats(30);

// Voir tous les logs
aiTokenLogger.getStats(30).logs;

// Export CSV
aiTokenLogger.downloadCSV();

// Reset complet
localStorage.clear(); // Attention, efface TOUT
```

---

## 📝 Notes importantes

1. **Cache localStorage** : Les insights sont mis en cache (24h pour daily, 7j pour weekly)
   - Pour forcer un refresh : Clear localStorage ou attendre expiration

2. **Coûts** : Avec facturation, pas de limite de quota mais coûts légèrement plus élevés
   - Gemini 2.5 Flash reste **très économique** (~$0.003/jour)

3. **Monitoring** : Les logs s'accumulent dans localStorage (max 1000 entrées)
   - Export régulier en CSV recommandé pour analyse

---

**Date de modification** : 2024-12-20
**Fichiers modifiés** :
- `src/services/gemini.ts` (augmentation limites + logging)
- `src/services/aiTokenLogger.ts` (système de monitoring)
- `src/components/Dashboard/AITokenStatsCard.tsx` (UI stats)
