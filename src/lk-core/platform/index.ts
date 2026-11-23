// LK Platform — Cross-Platform Token Exporters (JSON, CSS, Kotlin Compose) & Regional Formatting
export {
  buildPlatformTokenPayload,
  exportTokensAsJson,
  exportTokensAsCss,
  exportTokensAsKotlinCompose,
} from '../tokens/exportTokens';

export {
  LK_TRANSLATIONS,
  getLkDictionary,
  formatLkDateTime,
  formatLkNumber,
} from '../i18n/translations';
export type { LkDictionary } from '../i18n/types';
export type { LkLanguage, LkTimeFormat, LkNumberFormat } from '../types';
