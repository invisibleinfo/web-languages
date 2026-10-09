import { Fragment, createElement, type ReactNode } from "react";
import type { Locale } from "./locales";

/** Text whose wording depends on a count. `few` and `many` are only
 * needed by languages whose grammar has them; anything missing falls
 * back to `other`. */
export type PluralText = { one: string; other: string; few?: string; many?: string };

/** Fills `{name}` placeholders with plain values. */
export function format(text: string, values: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in values ? String(values[name]) : match,
  );
}

/** Like `format`, but values can be React elements (e.g. a bold number). */
export function formatNodes(text: string, values: Record<string, ReactNode>): ReactNode {
  return text.split(/(\{\w+\})/g).map((part, index) => {
    const name = part.match(/^\{(\w+)\}$/)?.[1];
    return createElement(Fragment, { key: index }, name && name in values ? values[name] : part);
  });
}

/** Picks the right plural form for `count` in this language and fills its
 * placeholders ({count} plus any extra `values`). */
export function plural(
  locale: Locale,
  forms: PluralText,
  count: number,
  values: Record<string, string | number> = {},
): string {
  const category = new Intl.PluralRules(locale).select(count);
  const text = category === "one" || category === "few" || category === "many" ? forms[category] : undefined;
  return format(text ?? forms.other, { ...values, count });
}
