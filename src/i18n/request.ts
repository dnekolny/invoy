import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { defaultLocale, LOCALE_COOKIE, locales, type Locale } from "./config";

export default getRequestConfig(async () => {
  const store = await cookies();
  const cookie = store.get(LOCALE_COOKIE)?.value;
  const locale: Locale = locales.includes(cookie as Locale) ? (cookie as Locale) : defaultLocale;
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
