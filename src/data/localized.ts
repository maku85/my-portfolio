export type LocalizedText = string | { en: string; it: string };

export function localize(value: LocalizedText, locale: string): string {
  if (typeof value === "string") return value;
  return locale === "it" ? value.it : value.en;
}

export function baseText(value: LocalizedText): string {
  return typeof value === "string" ? value : value.en;
}

export function localizeList(
  values: LocalizedText[],
  locale: string,
): string[] {
  return values.map((value) => localize(value, locale));
}
