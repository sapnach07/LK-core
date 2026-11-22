import type { LkLanguage, LkNumberFormat, LkTimeFormat, PlaygroundSectionId } from '../types';

export interface LkDictionary {
  brandSubtitle: string;
  nav: Record<PlaygroundSectionId, string>;
  navGroups: {
    foundation: string;
    laboratory: string;
    system: string;
  };
  actions: {
    resetDefaults: string;
    exportTokens: string;
    toggleTheme: string;
    openSettings: string;
    testToast: string;
    save: string;
    cancel: string;
  };
  settingsHeaders: {
    title: string;
    subtitle: string;
    appearance: string;
    themeCustom: string;
    accent: string;
    glass: string;
    motion: string;
    typography: string;
    density: string;
    notifications: string;
    language: string;
    privacy: string;
    storage: string;
    appInfo: string;
  };
}

export const LK_TRANSLATIONS: Record<LkLanguage, LkDictionary> = {
  en: {
    brandSubtitle: 'Design System Foundation',
    nav: {
      overview: 'Overview',
      components: 'Components',
      themes: 'Theme Editor',
      settings: 'Settings Center',
      glass: 'Glass Lab',
      motion: 'Motion Lab',
      icons: 'Icon Gallery',
      responsive: 'Responsive View',
      docs: 'Documentation',
    },
    navGroups: {
      foundation: 'Foundation',
      laboratory: 'Laboratories',
      system: 'System & Docs',
    },
    actions: {
      resetDefaults: 'Reset Defaults',
      exportTokens: 'Export Tokens',
      toggleTheme: 'Toggle Theme',
      openSettings: 'Settings',
      testToast: 'Send Test Alert',
      save: 'Save',
      cancel: 'Cancel',
    },
    settingsHeaders: {
      title: 'Settings Center',
      subtitle: 'Configure appearance, glass physics, accessibility, and local persistence across all LK modules.',
      appearance: 'Appearance',
      themeCustom: 'Theme Customization',
      accent: 'Accent Color',
      glass: 'Glass Effects & Blur',
      motion: 'Animation Preferences',
      typography: 'Typography & Scale',
      density: 'Interface Density',
      notifications: 'Notifications',
      language: 'Language & Regional',
      privacy: 'Privacy Preferences',
      storage: 'Storage Information',
      appInfo: 'Application Information',
    },
  },
  es: {
    brandSubtitle: 'Base del Sistema de Diseño',
    nav: {
      overview: 'Resumen',
      components: 'Componentes',
      themes: 'Editor de Temas',
      settings: 'Centro de Ajustes',
      glass: 'Laboratorio Cristal',
      motion: 'Animaciones',
      icons: 'Galería de Iconos',
      responsive: 'Vista Adaptable',
      docs: 'Documentación',
    },
    navGroups: {
      foundation: 'Fundación',
      laboratory: 'Laboratorios',
      system: 'Sistema y Guías',
    },
    actions: {
      resetDefaults: 'Restablecer',
      exportTokens: 'Exportar Tokens',
      toggleTheme: 'Cambiar Tema',
      openSettings: 'Ajustes',
      testToast: 'Probar Alerta',
      save: 'Guardar',
      cancel: 'Cancelar',
    },
    settingsHeaders: {
      title: 'Centro de Ajustes',
      subtitle: 'Configura apariencia, física de cristal, accesibilidad y persistencia local en todos los módulos LK.',
      appearance: 'Apariencia',
      themeCustom: 'Personalización de Tema',
      accent: 'Color de Acento',
      glass: 'Efectos de Cristal y Desenfoque',
      motion: 'Preferencias de Animación',
      typography: 'Tipografía y Escala',
      density: 'Densidad de Interfaz',
      notifications: 'Notificaciones',
      language: 'Idioma y Región',
      privacy: 'Privacidad',
      storage: 'Información de Almacenamiento',
      appInfo: 'Información de la Aplicación',
    },
  },
  fr: {
    brandSubtitle: 'Fondation du Design System',
    nav: {
      overview: 'Aperçu',
      components: 'Composants',
      themes: 'Éditeur de Thème',
      settings: 'Centre des Paramètres',
      glass: 'Laboratoire Verre',
      motion: 'Mouvements',
      icons: 'Galerie d’Icônes',
      responsive: 'Aperçu Réactif',
      docs: 'Documentation',
    },
    navGroups: {
      foundation: 'Fondation',
      laboratory: 'Laboratoires',
      system: 'Système et Docs',
    },
    actions: {
      resetDefaults: 'Réinitialiser',
      exportTokens: 'Exporter Tokens',
      toggleTheme: 'Changer Thème',
      openSettings: 'Paramètres',
      testToast: 'Tester Alerte',
      save: 'Enregistrer',
      cancel: 'Annuler',
    },
    settingsHeaders: {
      title: 'Centre des Paramètres',
      subtitle: 'Configurez l’apparence, les effets de verre, l’accessibilité et le stockage local.',
      appearance: 'Apparence',
      themeCustom: 'Personnalisation du Thème',
      accent: 'Couleur d’Accent',
      glass: 'Effets Verre et Flou',
      motion: 'Préférences d’Animation',
      typography: 'Typographie et Échelle',
      density: 'Densité de l’Interface',
      notifications: 'Notifications',
      language: 'Langue et Région',
      privacy: 'Confidentialité',
      storage: 'Stockage Local',
      appInfo: 'Informations Application',
    },
  },
  de: {
    brandSubtitle: 'Designsystem-Grundlage',
    nav: {
      overview: 'Übersicht',
      components: 'Komponenten',
      themes: 'Themen-Editor',
      settings: 'Einstellungen',
      glass: 'Glas-Labor',
      motion: 'Bewegung',
      icons: 'Symbol-Galerie',
      responsive: 'Responsive Ansicht',
      docs: 'Dokumentation',
    },
    navGroups: {
      foundation: 'Grundlagen',
      laboratory: 'Labore',
      system: 'System & Doku',
    },
    actions: {
      resetDefaults: 'Zurücksetzen',
      exportTokens: 'Tokens Exportieren',
      toggleTheme: 'Thema Wechseln',
      openSettings: 'Einstellungen',
      testToast: 'Testmeldung',
      save: 'Speichern',
      cancel: 'Abbrechen',
    },
    settingsHeaders: {
      title: 'Einstellungszentrum',
      subtitle: 'Steuern Sie Erscheinungsbild, Glas-Effekte, Barrierefreiheit und lokale Speicherung.',
      appearance: 'Erscheinungsbild',
      themeCustom: 'Themen-Anpassung',
      accent: 'Akzentfarbe',
      glass: 'Glaseffekte & Unschärfe',
      motion: 'Bewegungspräferenzen',
      typography: 'Typografie & Skalierung',
      density: 'Oberflächendichte',
      notifications: 'Benachrichtigungen',
      language: 'Sprache & Region',
      privacy: 'Datenschutz',
      storage: 'Speicherinformationen',
      appInfo: 'Anwendungsinformationen',
    },
  },
};

export function formatLkDateTime(
  date: Date,
  language: LkLanguage,
  timeFormat: LkTimeFormat,
): string {
  const localeMap: Record<LkLanguage, string> = {
    en: 'en-US',
    es: 'es-ES',
    fr: 'fr-FR',
    de: 'de-DE',
  };
  return new Intl.DateTimeFormat(localeMap[language], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: timeFormat === '12h',
  }).format(date);
}

export function formatLkNumber(value: number, numberFormat: LkNumberFormat): string {
  const locale = numberFormat === 'EU' ? 'de-DE' : 'en-US';
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value);
}
