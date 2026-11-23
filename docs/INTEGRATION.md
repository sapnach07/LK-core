# Guide d’intégration & de distribution — `@lk/core` 1.0.0

Ce document décrit comment intégrer `@lk/core` dans une application React externe (ex. **LK Manage**), personnaliser les thèmes et graphiques, mettre à jour la bibliothèque, et publier de nouvelles versions sur npm ou GitHub.

---

## 1. Installer `@lk/core` dans un projet React externe

### Depuis un registre npm (recommandé après publication)
```bash
npm install @lk/core
```

### Depuis un dépôt GitHub versionné
```bash
npm install github:<organisation>/lk-core#v1.0.0
```

### En test local avec un tarball généré par `npm pack`
Dans le projet `lk-core` :
```bash
npm run build:lib
npm pack
```
Dans votre application cliente (`lk-manage`) :
```bash
npm install ../chemin/vers/lk-core-1.0.0.tgz
```

> **Peer dependencies** : vérifiez que votre projet client dispose déjà de `react` (`^18.2.0 || ^19.0.0`) et `react-dom` (`^18.2.0 || ^19.0.0`).

---

## 2. Importer `LkProvider` (et isoler les préférences par application)

Enveloppez la racine de votre application cliente avec `LkProvider` et `LkToastRegion`.  
Utilisez `storagePrefix` pour que chaque application conserve ses propres préférences sans synchroniser ni écraser celles d’une autre application LK.

```tsx
import { LkProvider, LkToastRegion } from '@lk/core';

export default function App() {
  return (
    <LkProvider
      storagePrefix="lk-manage"
      defaultSettings={{
        language: 'fr',
        themeMode: 'dark',
        accentColor: '#D6B56D',
      }}
    >
      <MonApplication />
      <LkToastRegion />
    </LkProvider>
  );
}
```

- `manageDocumentTitle` vaut `false` par défaut pour préserver le `<title>` propre à votre application cliente.
- Pour vos données métier locales, utilisez `createLkStore` depuis `@lk/core/storage` avec une clé dédiée à votre application.

---

## 3. Importer les composants UI (`@lk/core/design`, `@lk/core/glass`, `@lk/core/icons`)

```tsx
import {
  LkButton,
  LkCard,
  LkInput,
  LkSelect,
  LkSwitch,
  LkDialog,
} from '@lk/core/design';
import { LkGlassSurface, LkGlassHeader } from '@lk/core/glass';
import { LkIcon, LkLogoMark } from '@lk/core/icons';
```

---

## 4. Importer les graphiques (`@lk/core/charts`)

Tous les graphiques reçoivent leurs données via leurs props (aucune donnée fictive interne) et gèrent automatiquement :
- Les thèmes clair et sombre
- La couleur d’accent active de `LkProvider`
- L’état de chargement (`loading`), l’état vide (`data={[]}`) et les erreurs (`error`)
- La préférence `motionLevel: 'reduced'` (suppression automatique des animations)

```tsx
import {
  LkLineChart,
  LkBarChart,
  LkAreaChart,
  LkPieChart,
  LkDonutChart,
  LkProgressChart,
  LkSparkline,
  LkChartTooltip,
  LkChartLegend,
} from '@lk/core/charts';

export function AnalyticsPanel({ rows, categories }) {
  return (
    <div className="grid gap-6">
      <LkLineChart
        data={rows}
        xKey="date"
        series={[
          { key: 'revenus', label: 'Revenus' },
          { key: 'depenses', label: 'Dépenses' },
        ]}
        height={260}
      />

      <LkDonutChart
        data={categories}
        centerValue="92%"
        centerLabel="Objectif"
        height={240}
      />

      <LkProgressChart
        value={78}
        max={100}
        label="Tâches terminées"
        variant="bar"
      />

      <LkSparkline data={[12, 18, 15, 24, 31]} variant="area" height={48} />
    </div>
  );
}
```

---

## 5. Charger les styles (`@lk/core/styles.css` ou `@lk/core/tokens.css`)

### Cas A : Projet React standard (avec ou sans Tailwind CSS)
Importez simplement dans `src/main.tsx` :
```tsx
import '@lk/core/styles.css';
```
`dist/styles.css` inclut :
- Toutes les variables CSS `--lk-*` (`:root` et `.dark`)
- Les classes `.lk-glass-surface`, `.lk-no-glass`, `.lk-high-contrast`, `.lk-reduced-motion`, `.lk-focus-ring`
- Les keyframes et animations (`lkFadeSlideUp`, `lkStaggerSlide`)
- Les styles utilitaires des composants et des graphiques `.lk-chart-*`
- Aucun reset global agressif (Preflight exclu) pour ne pas perturber vos styles existants.

### Cas B : Projet utilisant déjà Tailwind CSS v4
`import '@lk/core/styles.css';` fonctionne directement sans imposer de configuration supplémentaire.  
Si vous préférez n’importer que les variables et classes `.lk-*`, utilisez :
```css
@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));
@import "@lk/core/tokens.css";
```

---

## 6. Utiliser les thèmes (`dark`, `light`, `system`)

```tsx
import { useLkTheme } from '@lk/core/themes';
import { LkSegmentedControl } from '@lk/core/design';

export function ThemeSwitcher() {
  const { themeMode, updateSettings } = useLkTheme();

  return (
    <LkSegmentedControl
      ariaLabel="Mode d'affichage"
      value={themeMode}
      onChange={(mode) => updateSettings({ themeMode: mode })}
      options={[
        { value: 'dark', label: 'Sombre' },
        { value: 'light', label: 'Clair' },
        { value: 'system', label: 'Système' },
      ]}
    />
  );
}
```

---

## 7. Personnaliser les couleurs et préréglages

```tsx
const { updateSettings, applyThemePreset } = useLkTheme();

// Appliquer une couleur d'accent hexadécimale personnalisée
updateSettings({ accentColor: '#2FB87D', themePreset: 'custom' });

// Appliquer un thème prédéfini
applyThemePreset('midnight-cobalt');
```

Vous pouvez aussi déposer le panneau complet `<LkQuickSettingsPanel />` depuis `@lk/core/settings` pour offrir aux utilisateurs les contrôles de thème, verre, flou, animation et contraste.

---

## 8. Stratégie de versionnement et mise à jour multi-applications

`@lk/core` suit le standard **SemVer** (`MAJEUR.MINEUR.CORRECTION`) :

- `1.0.x` (**Correction**) : correctifs visuels ou internes rétrocompatibles.
- `1.x.0` (**Mineure**) : nouveaux composants, tokens ou options. `sanitizeLkSettings()` complète automatiquement les préférences déjà enregistrées dans le navigateur client sans perte de données.
- `2.0.0` (**Majeure**) : modification d’API publique avec note de migration.

### Mettre à jour une application cliente
```bash
# Avec registre GitHub Packages ou npm
npm install @lk/core@1.x.y

# Avec une archive .tgz locale
npm install ./vendor/lk-core-1.x.y.tgz

# Vérifier le typage et le build client
npx tsc --noEmit && npm run build
```

---

## 9. Résoudre les erreurs courantes

| Symptôme | Cause probable | Solution |
| :--- | :--- | :--- |
| Composants sans styles ou sans flou | `styles.css` non importé | Ajouter `import '@lk/core/styles.css';` dans `main.tsx` |
| `useLkCore must be used within <LkProvider>` | Hook appelé hors du provider | Envelopper l’arbre racine avec `<LkProvider>` |
| Conflit de préférences entre 2 apps | Clé `localStorage` partagée | Renseigner `storagePrefix="mon-app"` sur `<LkProvider>` |
| Erreur React Hooks dupliqués | Double instance de `react` | Vérifier que `react` et `react-dom` ne sont pas dupliqués (`npm dedupe`) |
| Graphique Recharts invisible | Conteneur parent de hauteur `0` | Utiliser la prop `height={260}` ou donner une hauteur au parent |
| Classes `dark:` inactives côté client | Tailwind v4 par défaut sur `media` | Ajouter `@custom-variant dark (&:where(.dark, .dark *));` |

---

## 10. Préparation et canaux de distribution gratuits (sans publication publique)

### Contrôles obligatoires avant toute distribution
```bash
npm test
npm run lint
npm run build:lib
npm run verify:exports
npm pack --dry-run
```

### Option 1 — Archive `.tgz` privée via `npm pack` (0 €, immédiat)
1. Générer l’archive localement dans `lk-core` :
   ```bash
   npm run build:lib && npm pack
   ```
2. Copier `lk-core-1.0.0.tgz` dans un dossier `vendor/` de chaque projet Google AI Studio externe et l’installer :
   ```bash
   npm install ./vendor/lk-core-1.0.0.tgz
   ```
   > Avantage : fonctionne sans compte registre, conserve tout votre code privé et inclut `dist/` précompilé.

### Option 2 — GitHub Packages privé (0 € jusqu’à 500 Mo / 1 Go/mois)
1. Configurer le fichier `.npmrc` du projet consommateur (et un jeton personnel `read:packages`) :
   ```ini
   @lk:registry=https://npm.pkg.github.com
   //npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
   ```
2. Publier depuis votre environnement autorisé avec `"publishConfig": { "registry": "https://npm.pkg.github.com" }` ou l’option `--registry=https://npm.pkg.github.com` (sans rendre le dépôt public).

### Option 3 — Release ou tag GitHub privé contenant `dist/` (0 €)
Comme `dist/` est exclu de `main` par `.gitignore`, un `npm install github:...#main` brut ne disposerait pas des fichiers compilés. Deux solutions gratuites sur dépôt privé :
- Joindre `lk-core-1.0.0.tgz` à une **GitHub Release privée** et l’installer depuis l’URL de release/archive locale ;
- Ou créer un tag/branche de distribution dédié (`release/v1.0.0`) où `dist/` est compilé et ajouté explicitement.

