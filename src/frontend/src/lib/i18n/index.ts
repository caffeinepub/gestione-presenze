/**
 * Simple i18n utility for Italian localization
 * Provides type-safe access to translation strings with interpolation support
 */

import { it } from './it';

type NestedKeyOf<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? `${K}.${NestedKeyOf<T[K]>}`
          : K
        : never;
    }[keyof T]
  : never;

type TranslationPath = NestedKeyOf<typeof it>;

/**
 * Get translation string by dot-notation path
 * @param key - Dot-notation path to translation (e.g., 'common.loading')
 * @param params - Optional parameters for string interpolation
 * @returns Translated string
 */
export function t(key: string, params?: Record<string, string | number>): string {
  const keys = key.split('.');
  let value: any = it;

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
  }

  if (typeof value !== 'string') {
    console.warn(`Translation value is not a string: ${key}`);
    return key;
  }

  // Simple interpolation: replace {param} with values
  if (params) {
    return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
      return paramKey in params ? String(params[paramKey]) : match;
    });
  }

  return value;
}

/**
 * Export the translation dictionary for direct access
 */
export { it };
