# Invoy – plán implementace

> Stav k 2026-10-18: fáze 0–6 nasazené na https://invoy-six.vercel.app. Zbývá doladění podle zpětné vazby a položky v sekci „Později“.

Jednoduchý nástroj na vystavování a odesílání faktur. Multi-tenant (každý uživatel své firmy a zákazníky), zdarma pro známé.

## Rozhodnutí ze zadání (2026-10-16)

| Oblast | Rozhodnutí |
|---|---|
| Uživatelé | SaaS, každý uživatel vlastní firmu/firmy a zákazníky |
| Přihlášení | Google OAuth + e-mail s jednorázovým kódem (bez hesla) |
| DPH | Přepínač per firma: plátce / neplátce |
| Doklady v1 | Faktura, zálohová (proforma) faktura, opakované faktury |
| Po odeslání | Evidence úhrad, veřejný odkaz na fakturu (online náhled + PDF, sledování otevření) |
| CZ specifika | QR platba (SPAYD), ARES podle IČO, EUR + anglická verze PDF, export CSV/XLSX |
| Vzhled PDF | Více šablon, logo + barva; do budoucna WYSIWYG editor šablon |
| Číslování | Nastavitelný vzor s proměnnými, oddělené řady, roční reset |
| Data | Ceník položek, více bankovních účtů (CZK/EUR) |
| Odesílání | Uživatel si vybere: Gmail (OAuth), Seznam (SMTP), vlastní SMTP |
| UI jazyk | Čeština i angličtina od začátku |
| Nasazení | Vercel, produkce `invoy-six.vercel.app` (doména `invoy.vercel.app` patří cizímu projektu), repo github.com/dnekolny/invoy |

## Technologický stack

| Vrstva | Volba | Důvod |
|---|---|---|
| Framework | Next.js 15 (App Router, TypeScript) | Jedna codebase pro UI, API i cron; nativní na Vercelu |
| UI | Tailwind CSS + shadcn/ui | Rychlé, čisté formuláře a tabulky bez vlastního design systému |
| Databáze | Postgres (Neon přes Vercel Marketplace) + Drizzle ORM | Serverless-friendly, typované schéma, migrace v repu |
| Auth | Better Auth (Google + plugin emailOTP) | Hotový OTP kód e-mailem, Google social login, session v DB |
| i18n | next-intl | cs/en v UI i v PDF |
| PDF | HTML šablona (čistý string) → puppeteer-core + @sparticuz/chromium | Stejné HTML pro náhled v aplikaci, veřejný odkaz i PDF; šablony jako funkce vracející HTML, cesta k WYSIWYG |
| Soubory | Logo jako data URL v DB (max 600 px) | Bez Blob storage, PDF se generuje na vyžádání |
| Odesílání faktur | nodemailer (SMTP) s presety Gmail (app password), Seznam, vlastní | Heslo šifrované AES-256-GCM (`ENCRYPTION_KEY`); Gmail OAuth odloženo |
| Systémové e-maily | nodemailer přes SMTP vlastníka (v1), později Resend na vlastní doméně | OTP kódy, bez domény nelze použít Resend |
| Cron | Vercel Cron (denně 5:00 UTC, `CRON_SECRET`) | Opakované faktury; „po splatnosti“ se počítá dynamicky z data splatnosti |
| QR platba | vlastní SPAYD builder + `qrcode` | Standard českých bank |
| Kurzy | ČNB denní kurzovní lístek | Kurz na cizoměnové faktuře pro plátce DPH |
| Validace | zod | Sdílená mezi formuláři a API |
| Peníze | numeric(14,2) v DB, decimal.js v kódu | Žádné float chyby |

## Datový model

- **user** – Better Auth (id, email, name, image)
- **company** – vlastník, název, IČO, DIČ, adresa, `vatPayer`, logo, výchozí splatnost, výchozí měna, šablona + barva, vzory číslování (`invoicePattern`, `proformaPattern`), text zápatí
- **bank_account** – company, název, číslo účtu/kód banky, IBAN, SWIFT, měna, výchozí
- **customer** – company, název, IČO, DIČ, adresa, e-mail, splatnost, poznámka
- **item** – company (ceník), název, popis, jednotka, cena, sazba DPH
- **invoice** – company, customer (snapshot údajů), typ (`invoice` / `proforma`), stav (`draft` / `sent` / `paid` / `overdue` / `cancelled`), číslo, datum vystavení, DUZP, splatnost, měna, kurz, bank_account, součty, `publicToken`, `proformaId` (vazba záloha → faktura), `recurringId`
- **invoice_line** – invoice, pořadí, název, množství, jednotka, cena/ks, sazba DPH, částky
- **payment** – invoice, datum, částka, poznámka
- **recurring_template** – company, zákazník, položky, interval (měsíc/čtvrtletí/rok), další datum, automaticky odeslat ano/ne
- **email_channel** – company, typ (`gmail` / `smtp`), odesílací adresa, zašifrované přihlašovací údaje / OAuth tokeny
- **email_log** – invoice, komu, kdy, stav, `openedAt`
- **numbering_counter** – company, řada, rok, poslední číslo

## Fáze

### 0. Základ (skeleton)
- Next.js projekt, Tailwind, shadcn/ui, next-intl (cs/en), Drizzle + Neon
- Better Auth: Google + OTP kód e-mailem
- Layout aplikace, nasazení na Vercel, env proměnné
- **Výstup:** přihlásím se, vidím prázdný dashboard

### 1. Nastavení firmy a číselníky
- Onboarding: založení firmy (ARES podle IČO), přepínač plátce DPH
- Bankovní účty, ceník položek
- Zákazníci (CRUD, ARES)
- Vzory číslování s náhledem
- **Výstup:** firma kompletně nastavená

### 2. Faktura
- Editor faktury: hlavička, položky s našeptávačem z ceníku, výpočet DPH per sazba, cizí měna + kurz ČNB
- Automatické číslo při vystavení (draft nemá číslo)
- Seznam faktur s filtry a stavy
- Zálohová faktura, tlačítko „vytvořit fakturu ze zálohy“
- **Výstup:** faktura vzniká, počítá správně, drží náležitosti

### 3. PDF a šablony
- 2 šablony (klasická, moderní), logo, akcentová barva
- CZ/EN varianta PDF podle jazyka zákazníka
- QR platba (SPAYD) na faktuře
- Playwright render na Vercelu, cache do Blob
- **Výstup:** stáhnu hotové PDF

### 4. Odesílání
- Nastavení e-mailového kanálu: Gmail OAuth, Seznam preset, vlastní SMTP, test odeslání
- Veřejný odkaz `/i/{token}`: náhled, stažení PDF, zaznamenání otevření
- Odeslání faktury s PDF v příloze, upravitelný text e-mailu, log odeslání
- **Výstup:** zákazník dostane fakturu, vidím, že ji otevřel

### 5. Úhrady a přehled
- Označení zaplaceno (částečné platby), cron přepíná na „po splatnosti“
- Dashboard: nezaplaceno, po splatnosti, fakturováno za měsíc/rok
- Export CSV/XLSX za období
- **Výstup:** mám přehled o cash-flow

### 6. Opakované faktury
- Šablona opakování, cron generuje draft nebo rovnou vystaví a odešle
- Notifikace vlastníkovi
- **Výstup:** měsíční paušály chodí samy

### 7. Doladění
- Onboarding pro nové uživatele, prázdné stavy, chybové hlášky
- Více firem na jeden účet
- Responzivita na mobilu

## Později (mimo v1)
- Gmail OAuth (gmail.send) místo app password
- WYSIWYG editor šablon (layout jako JSON → React render); mezikrok hotov 2026-10-21: vlastní šablony s placeholdery generované AI z obrázku (Premium, `ANTHROPIC_API_KEY`, `company.premium`)
- Dobropisy / opravné doklady
- Párování plateb z banky (Fio API, ČSOB)
- Resend na vlastní doméně pro systémové e-maily
- Pozvání dalších lidí do firmy (role)

## Co je potřeba od uživatele
1. GitHub repo (prázdné) a propojení s Vercelem
2. Google Cloud projekt s OAuth klientem (Client ID + Secret) – scope `email profile`, později `gmail.send`
3. SMTP přístup pro systémové e-maily (OTP kódy) – např. app password Gmailu, uložit do `.env` mimo chat
4. Neon databáze přes Vercel Marketplace (zvládnu přes MCP po propojení projektu)
