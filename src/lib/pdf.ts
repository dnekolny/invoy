import type { Browser } from "puppeteer-core";

async function launch(): Promise<Browser> {
  const puppeteer = await import("puppeteer-core");
  if (process.env.CHROME_PATH) {
    return puppeteer.default.launch({ executablePath: process.env.CHROME_PATH, headless: true, args: ["--no-sandbox"] });
  }
  const chromium = (await import("@sparticuz/chromium")).default;
  return puppeteer.default.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
  });
}

export async function htmlToPdf(html: string): Promise<Uint8Array> {
  const browser = await launch();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load", timeout: 20000 });
    await page.evaluate(() => (document as unknown as { fonts: { ready: Promise<unknown> } }).fonts.ready);
    return await page.pdf({ format: "A4", printBackground: true, preferCSSPageSize: true });
  } finally {
    await browser.close();
  }
}
