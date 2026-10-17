const TOKEN = /\{(YYYY|YY|MM|N+)\}/g;

export function formatNumber(pattern: string, date: Date, seq: number) {
  return pattern.replace(TOKEN, (_, token: string) => {
    if (token === "YYYY") return String(date.getFullYear());
    if (token === "YY") return String(date.getFullYear()).slice(-2);
    if (token === "MM") return String(date.getMonth() + 1).padStart(2, "0");
    return String(seq).padStart(token.length, "0");
  });
}

export function isValidPattern(pattern: string) {
  return /\{N+\}/.test(pattern) && pattern.replace(TOKEN, "").indexOf("{") === -1;
}

export function patternYearly(pattern: string) {
  return /\{YYYY\}|\{YY\}/.test(pattern);
}
