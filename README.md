# `@lk/core` (v1.1.0) — Bibliothèque LK Core

Système de design **LK Hybrid Glass**, bibliothèque de composants React + TypeScript, moteur de thèmes dynamique, paramètres locaux isolés par application, accessibilité WCAG et module de visualisation **LK Charts** pour l’ensemble des applications de l’écosystème LK (web, React, TypeScript et Google AI Studio).

- **Zéro backend obligatoire**, zéro Firebase, zéro clé API ou dépendance payante.
- **Bundles ESM + déclarations `.d.ts` complètes** (`dist/*.js`, `dist/**/*.d.ts`).
- **Feuilles CSS prêtes à l’emploi** (`@lk/core/styles.css` autonome ou `@lk/core/tokens.css`).
- **Aucune donnée sensible incluse** dans l’archive de distribution.

---

## 1. Prérequis et dépendances

### `peerDependencies` (à fournir par l’application cliente)
- `react`: `^18.2.0 || ^19.0.0`
- `react-dom`: `^18.2.0 || ^19.0.0`

### `dependencies` (installées automatiquement avec `@lk/core`)
- `lucide-react` (`^0.546.0`) — icônes vectorielles du registre `LK_ICON_CATALOG`
- `recharts` (`^3.11.0`) — moteur de graphiques pour `LK Charts`
- `react-is` (`^19.3.1`) — utilitaire requis par Recharts sous React 18/19

> Les dépendances du Playground de démonstration (`vite`, `tailwindcss`, `motion`, `express`, `@google/genai`, `tsx`, etc.) restent strictement dans `devDependencies` et ne sont **jamais** embarquées dans le paquet distribué.

---

## 2. Procédure d’installation dans un projet Google AI Studio externe

Cette procédure s’applique à toute application LK créée avec Google AI Studio (ex. **LK Manage**, React + TypeScript + Vite) :

### Étape 1 — Installer le paquet `@lk/core`
Selon le mode de distribution choisi (voir section 6) :

```bash
# Option A : depuis un fichier archive généré par `npm pack` (100 % gratuit et privé)
npm install ./vendor/lk-core-1.1.0.tgz

# Option B : depuis GitHub Packages privé (après configuration .npmrc)
npm install @lk/core@1.1.0

# Option C : depuis un tag GitHub privé contenant dist/
npm install git+ssh://git@github.com:<organisation>/lk-core.git#v1.1.0
```

### Étape 2 — Charger les styles LK Core dans `src/main.tsx`
- **Pour toute application React/TypeScript (avec ou sans Tailwind CSS)** :
```tsx
import { createRoot } from 'react-dom/client';
import '@lk/core/styles.css';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(<App />);
```
- **Option avancée si votre application utilise déjà Tailwind CSS v4** et que vous souhaitez uniquement importer les variables `--lk-*` et les classes `.lk-*` sans les classes utilitaires compilées :
```css
/* src/index.css */
@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));
@import "@lk/core/tokens.css";
```

### Étape 3 — Envelopper la racine dans `src/App.tsx` avec `LkProvider`
Utilisez impérativement `storagePrefix` afin que chaque application LK isole ses préférences dans `localStorage` :

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
      manageDocumentTitle={false}
    >
      <MonApplication />
      <LkToastRegion />
    </LkProvider>
  );
}
```

### Étape 4 — Vérifier la compilation cliente
```bash
npx tsc --noEmit && npm run build
```

---

## 3. Exports publics et utilisation de chaque module

Vous pouvez importer depuis le point d’entrée global `@lk/core` ou cibler un sous-module précis pour un tree-shaking optimal :

| Sous-chemin | Rôle principal | Exports clés |
| :--- | :--- | :--- |
| `@lk/core` | Point d’entrée global | Réexporte tous les types et les 10 modules ci-dessous |
| `@lk/core/design` | Primitives UI Hybrid Glass | `LkButton`, `LkCard`, `LkInput`, `LkSelect`, `LkSegmentedControl`, `LkSwitch`, `LkSlider`, `LkDialog`, `LkDropdown`, `LkToastRegion` |
| `@lk/core/charts` | Graphiques réactifs & accessibles | `LkLineChart`, `LkBarChart`, `LkAreaChart`, `LkPieChart`, `LkDonutChart`, `LkProgressChart`, `LkSparkline`, `LkChartTooltip`, `LkChartLegend` |
| `@lk/core/themes` | Moteur de thèmes et tokens | `LkProvider`, `useLkCore`, `useLkCoreOptional`, `useLkTheme`, `useLkToast`, `LK_BRAND_COLORS`, `LK_THEME_PRESETS`, `LK_ACCENT_SWATCHES` |
| `@lk/core/glass` | Surfaces verre & spéculaire | `LkGlassSurface`, `LkGlassPanel`, `LkGlassHeader` |
| `@lk/core/motion` | Animations & mouvement réduit | `LkMotionReveal`, `LkMotionInteractive`, `useLkMotionConfig` |
| `@lk/core/icons` | Registre d’icônes unifié | `LkLogoMark`, `LkIcon`, `LK_ICON_CATALOG`, `LK_ICON_REGISTRY` |
| `@lk/core/settings` | Moteur & panneau de paramètres | `useLkSettings`, `LkQuickSettingsPanel`, `DEFAULT_LK_SETTINGS`, `sanitizeLkSettings`, `parseLkSettingsJson` |
| `@lk/core/storage` | Persistance locale isolée | `createLkStore`, `loadLkSettings`, `saveLkSettings`, `resolveLkStorageKeys`, `getLkStorageStats`, `clearLkStorage` |
| `@lk/core/accessibility` | Contraste WCAG & anneau focus | `getAccessibleButtonInk`, `auditPairContrast`, `calculateContrastRatio`, `evaluateContrast`, `pickAccessibleForeground`, `LK_FOCUS_RING_CLASS` |
| `@lk/core/platform` | Exports multiplateformes & i18n | `exportTokensAsJson`, `exportTokensAsCss`, `exportTokensAsKotlinCompose`, `buildPlatformTokenPayload`, `getLkDictionary`, `formatLkDateTime`, `formatLkNumber` |
| `@lk/core/cloud` | SDK Cloud optionnel & Offline-First | `LkCloudProvider`, `LkCloudBridge`, `useLkCloud`, `useLkCloudOptional`, `createLkSyncEngine`, `verifyAndValidateCloudBundle`, `sanitizeSvgIcon`, `checkRollbackAuthorization` |
| `@lk/core/styles.css` | Styles complets autonomes | Variables `--lk-*`, verre `.lk-glass-*`, animations, graphiques `.lk-chart-*`, utilitaires composants |
| `@lk/core/tokens.css` | Tokens CSS seuls | Variables CSS `--lk-*` (`:root` / `.dark`), classes `.lk-glass-surface`, `.lk-focus-ring`, `.lk-reduced-motion` |

### Exemples par module

#### `@lk/core/design` — Composants d’interface
```tsx
import { useState } from 'react';
import { LkButton, LkCard, LkInput, LkSelect, LkSwitch, LkDialog } from '@lk/core/design';

export function FormulaireProjet() {
  const [nom, setNom] = useState('');
  const [actif, setActif] = useState(true);
  const [open, setOpen] = useState(false);

  return (
    <LkCard title="Nouveau projet" subtitle="Configuration rapide">
      <LkInput label="Nom du projet" value={nom} onChange={(e) => setNom(e.target.value)} />
      <LkSelect
        label="Environnement"
        value="prod"
        onChange={() => {}}
        options={[
          { value: 'prod', label: 'Production' },
          { value: 'staging', label: 'Préproduction' },
        ]}
      />
      <LkSwitch label="Activer la synchronisation" checked={actif} onChange={setActif} />
      <LkButton variant="primary" leftIcon="Check" onClick={() => setOpen(true)}>
        Valider
      </LkButton>
      <LkDialog open={open} onClose={() => setOpen(false)} title="Confirmation">
        Projet prêt à être enregistré.
      </LkDialog>
    </LkCard>
  );
}
```

#### `@lk/core/charts` — Visualisation de données
```tsx
import {
  LkLineChart,
  LkBarChart,
  LkAreaChart,
  LkPieChart,
  LkDonutChart,
  LkProgressChart,
  LkSparkline,
} from '@lk/core/charts';

export function TableauAnalytique({ seriesData, repartition }: { seriesData: any[]; repartition: any[] }) {
  return (
    <div className="grid gap-6">
      <LkLineChart
        data={seriesData}
        xKey="mois"
        series={[{ key: 'ca', label: 'Chiffre d’affaires' }]}
        height={260}
      />
      <LkBarChart data={seriesData} xKey="mois" series={[{ key: 'ca', label: 'Ventes' }]} height={240} />
      <LkAreaChart data={seriesData} xKey="mois" series={[{ key: 'ca', label: 'Tendance' }]} height={220} />
      <LkPieChart data={repartition} height={220} />
      <LkDonutChart data={repartition} centerValue="84%" centerLabel="Objectif" height={240} />
      <LkProgressChart value={84} max={100} label="Avancement global" variant="bar" />
      <LkSparkline data={[14, 19, 17, 25, 32]} variant="area" height={48} />
    </div>
  );
}
```

#### `@lk/core/themes` & `@lk/core/settings` — Thèmes, notifications et paramètres
```tsx
import { useLkTheme, useLkToast } from '@lk/core/themes';
import { LkQuickSettingsPanel, useLkSettings } from '@lk/core/settings';
import { LkButton } from '@lk/core/design';

export function BarreTheme() {
  const { settings, resolvedTheme, applyThemePreset } = useLkTheme();
  const { updateSettings } = useLkSettings();
  const { pushToast } = useLkToast();

  return (
    <>
      <LkButton
        variant="secondary"
        onClick={() => {
          applyThemePreset('midnight-cobalt');
          updateSettings({ themeMode: resolvedTheme === 'dark' ? 'light' : 'dark' });
          pushToast({ title: 'Thème mis à jour', variant: 'success' });
        }}
      >
        Basculer ({settings.themeMode})
      </LkButton>
      <LkQuickSettingsPanel />
    </>
  );
}
```

#### `@lk/core/glass`, `@lk/core/motion` & `@lk/core/icons` — Surfaces verre, animations et icônes
```tsx
import { LkGlassSurface, LkGlassHeader } from '@lk/core/glass';
import { LkMotionReveal, LkMotionInteractive, useLkMotionConfig } from '@lk/core/motion';
import { LkIcon, LkLogoMark } from '@lk/core/icons';

export function EnTeteVerre() {
  const { isReduced } = useLkMotionConfig();

  return (
    <LkMotionReveal delay={0.05}>
      <LkGlassHeader className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LkLogoMark size={24} />
          <span>LK Manage</span>
        </div>
        <LkMotionInteractive>
          <LkGlassSurface intensity="elevated" specular={!isReduced} className="px-3 py-1.5">
            <LkIcon name="Sparkles" size={16} />
          </LkGlassSurface>
        </LkMotionInteractive>
      </LkGlassHeader>
    </LkMotionReveal>
  );
}
```

#### `@lk/core/storage`, `@lk/core/accessibility` & `@lk/core/platform` — Stockage, WCAG et export de tokens
```tsx
import { createLkStore } from '@lk/core/storage';
import { auditPairContrast, pickAccessibleForeground } from '@lk/core/accessibility';
import { exportTokensAsCss, exportTokensAsKotlinCompose, formatLkNumber } from '@lk/core/platform';
import { DEFAULT_LK_SETTINGS } from '@lk/core/settings';

// Store métier isolé de la config LK Core
const tachesStore = createLkStore<string[]>('lk-manage.taches.v1', []);
tachesStore.save(['Configurer LK Core', 'Déployer']);

// Audit WCAG AA/AAA
const audit = auditPairContrast('#D6B56D', '#090A0D'); // ratio, aa, aaa
const encre = pickAccessibleForeground('#D6B56D');

// Export multiplateforme & formatage
const cssVariables = exportTokensAsCss(DEFAULT_LK_SETTINGS, 'dark');
const kotlinTokens = exportTokensAsKotlinCompose(DEFAULT_LK_SETTINGS, 'dark');
const montant = formatLkNumber(12450.5, 'space', 'fr');
```

#### `@lk/core/cloud` — SDK Cloud optionnel & synchronisation Offline-First

`@lk/core/cloud` reste **100 % optionnel** : le point d’entrée racine `@lk/core` ne l’importe pas et n’effectue aucun appel réseau lorsque Cloud n’est pas activé.

```tsx
import { LkCloudProvider, useLkCloud } from '@lk/core/cloud';
import { LkToastRegion } from '@lk/core';

export default function App() {
  return (
    <LkCloudProvider
      storagePrefix="lk-manage"
      defaultSettings={{ language: 'fr', themeMode: 'dark', accentColor: '#D6B56D' }}
      config={{
        appId: 'lk-manage',
        endpointUrl: 'https://cloud.example.com/api',
        allowedPermissions: ['themes', 'icons', 'settings', 'charts', 'platform'],
        trustedPublicKeys: [
          {
            keyId: 'lk-key-v1',
            algorithm: 'ECDSA-P256-SHA256',
            spkiBase64: '<CLE_PUBLIQUE_SPKI_BASE64>',
          },
        ],
      }}
    >
      <MonApplication />
      <LkToastRegion />
    </LkCloudProvider>
  );
}
```

**Principes de sécurité & fonctionnement :**
- **Permissions atomiques (`manifest.permissions`)** : chaque section du `payload` (`themes`, `icons`, `glass`, `motion`, `settings`, `accessibility`, `charts`, `platform`) doit être autorisée par `manifest.permissions` et rester dans `allowedPermissions` si défini ; toute violation rejette l’intégralité du bundle sans application partielle.
- **Signatures `lk-sig-v1`** : double vérification Web Crypto (`payloadSha256` sur JSON canonique + signature asymétrique `ECDSA-P256-SHA256` ou `Ed25519` sur l’enveloppe `LK-CORE-CLOUD-SIG-V1`), gestion des dates de validité et rotation par `keyId`.
- **Pairing sécurisé** : l’URL `endpointUrl` est préconfigurée en HTTPS (sauf `allowInsecureLocalhost` en dev local) et ne peut jamais être remplacée par un paramètre URL. Le code `?lk_pair=...` est extrait, nettoyé immédiatement via `history.replaceState` et protégé contre le rejeu.
- **Synchronisation Offline-First & anti-rollback** : mise en cache `localStorage` re-vérifiée au démarrage, `ETag` (`304`), backoff exponentiel, distinction stricte entre erreur HTTP `401`/`403` transitoire et révocation définitive (`APP_REVOKED`, `TOKEN_REVOKED`, `TOKEN_PERMANENTLY_INVALID`, `APP_DELETED`), conservation du dernier bundle valide, et blocage des downgrades non signés (`manifest.rollback` requis).
- **Limites de sécurité navigateur** : dans une application SPA React, le `readToken` stocké en `localStorage` est un jeton public/client en **lecture seule** scopé à l’application (jamais une clé privée ni un jeton administrateur) ; les icônes SVG distantes sont parsées sans `DOMParser`/`innerHTML` via une liste blanche XML/AST stricte.

---

## 4. Stratégie de versionnement et mise à jour multi-applications

`@lk/core` suit le standard **SemVer** (`MAJEUR.MINEUR.CORRECTION`) :

1. **Correction (`1.0.x`)** : correctifs visuels, accessibilité ou bugs internes sans changement d’API. Mise à jour directe sans modification côté client.
2. **Mineure (`1.x.0`)** : ajout de nouveaux composants, variantes ou clés de configuration. Les anciennes préférences sauvegardées dans le navigateur client restent valides grâce à `sanitizeLkSettings()` qui complète automatiquement les champs manquants.
3. **Majeure (`2.0.0`)** : changement de signature publique ou suppression d’un export (accompagnée d’une note de migration).

### Processus de mise à jour dans toutes vos applications LK
1. Dans `lk-core` : mettre à jour `"version"` dans `package.json`, exécuter `npm test && npm run lint && npm run build:lib && npm run verify:exports`.
2. Publier la nouvelle version (nouveau `.tgz`, nouveau tag GitHub privé précompilé ou GitHub Packages).
3. Dans chaque application cliente (`lk-manage`, etc.) :
   - Mettre à jour la version dans son `package.json` (`npm install @lk/core@1.x.y` ou nouveau `.tgz`).
   - Exécuter `npx tsc --noEmit && npm run build`.
   - Chaque application utilisant un `storagePrefix` distinct conserve ses propres préférences utilisateur intactes.

---

## 5. Possibilités de distribution gratuite (et privée)

| Canal | Coût | Confidentialité | Prérequis & remarques |
| :--- | :--- | :--- | :--- |
| **1. Archive `.tgz` locale (`npm pack`)** | **0 €** | **100 % privé** | Génère `lk-core-1.1.0.tgz` incluant `dist/` déjà compilé. Idéal pour copier directement dans un dossier `vendor/` de chaque projet Google AI Studio. |
| **2. GitHub Packages (`npm.pkg.github.com`)** | **0 €** | **Privé (dépôt privé)** | Plan gratuit GitHub : **500 Mo** de stockage et **1 Go/mois** de transfert pour dépôts privés. Nécessite un `.npmrc` avec jeton `read:packages` dans l’app cliente. |
| **3. Release / Tag GitHub privé précompilé** | **0 €** | **Privé (dépôt privé)** | `dist/` étant ignoré par `.gitignore` sur `main`, joignez le `.tgz` en pièce jointe d’une **GitHub Release privée** ou créez un tag de release contenant `dist/`. |
| **4. Registre npm public (`npmjs.com`)** | **0 €** | **Public uniquement** | Déconseillé si vous souhaitez garder le dépôt/code privé ; nécessite en outre la propriété du scope `@lk` sur npmjs.com. |

---

## 6. Scripts disponibles (développement & validation)

```bash
npm run dev              # Lance LK Core Playground sur http://localhost:3000
npm test                 # Exécute les tests unitaires (tsx --test)
npm run lint             # Vérifie les types TypeScript globaux (tsc --noEmit)
npm run build:lib        # Compile uniquement la bibliothèque (@lk/core dans dist/)
npm run verify:exports   # Contrôle tous les exports, .d.ts, CSS et dépendances externes
npm run build:playground # Compile uniquement LK Core Playground
npm run build            # Compile Playground + Bibliothèque
npm pack --dry-run       # Prévisualise les fichiers inclus dans l'archive sans publier
```

Voir également [docs/INTEGRATION.md](./docs/INTEGRATION.md) pour le pas-à-pas détaillé d’intégration, de sécurité Cloud et les commandes de release.
