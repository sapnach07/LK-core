import type { LkLanguage, LkNumberFormat, LkTimeFormat } from '../types';
import type { LkDictionary } from './types';
import { FR_DICTIONARY } from './locales/fr';
import { EN_DICTIONARY } from './locales/en';

export type { LkDictionary } from './types';

/**
 * Extensible locale registry.
 * French ('fr') is the default language. English ('en') and additional
 * languages ('es', 'de', etc.) can be registered or expanded here without
 * touching UI components.
 */
export const LK_TRANSLATIONS: Record<LkLanguage, LkDictionary> = {
  fr: FR_DICTIONARY,
  en: EN_DICTIONARY,
  es: {
    ...EN_DICTIONARY,
    meta: { pageTitle: 'LK Core 1.0 — Sistema de Diseño Hybrid Glass', languageName: 'Español' },
    brandSubtitle: 'Base del Sistema de Diseño',
    nav: {
      overview: 'Resumen',
      components: 'Componentes',
      charts: 'Gráficos LK Charts',
      themes: 'Editor de Temas',
      settings: 'Centro de Ajustes',
      glass: 'Laboratorio LK Glass',
      motion: 'Laboratorio LK Motion',
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
      subtitle: 'Configura apariencia, física de cristal, accesibilidad y persistencia local.',
      appearance: 'Apariencia',
      themeCustom: 'Personalización de Tema',
      accent: 'Color de Acento',
      glass: 'Efectos LK Glass y Desenfoque',
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
  de: {
    ...EN_DICTIONARY,
    meta: { pageTitle: 'LK Core 1.0 — Hybrid Glass Designsystem', languageName: 'Deutsch' },
    brandSubtitle: 'Designsystem-Grundlage',
    nav: {
      overview: 'Übersicht',
      components: 'Komponenten',
      charts: 'LK Charts',
      themes: 'Themen-Editor',
      settings: 'Einstellungen',
      glass: 'LK Glass Labor',
      motion: 'LK Motion Labor',
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
      glass: 'LK Glass Effekte & Unschärfe',
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

export function getLkDictionary(language: LkLanguage | string): LkDictionary {
  if (language in LK_TRANSLATIONS) {
    return LK_TRANSLATIONS[language as LkLanguage];
  }
  return LK_TRANSLATIONS.fr;
}

export function formatLkDateTime(
  date: Date,
  language: LkLanguage,
  timeFormat: LkTimeFormat,
): string {
  const localeMap: Record<LkLanguage, string> = {
    fr: 'fr-FR',
    en: 'en-US',
    es: 'es-ES',
    de: 'de-DE',
  };
  return new Intl.DateTimeFormat(localeMap[language] ?? 'fr-FR', {
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
