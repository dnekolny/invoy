export const metadata = { title: "Zásady ochrany osobních údajů – Invoy" };

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16 text-sm leading-relaxed">
      <h1 className="mb-6 text-2xl font-semibold">Zásady ochrany osobních údajů</h1>
      <p className="mb-4">
        Invoy je nástroj pro vystavování a odesílání faktur. Provozovatel zpracovává
        pouze údaje nezbytné pro fungování služby.
      </p>
      <h2 className="mb-2 mt-8 text-lg font-medium">Jaké údaje zpracováváme</h2>
      <ul className="mb-4 list-disc space-y-1 pl-5">
        <li>Přihlašovací údaje: e-mail, jméno a profilový obrázek z účtu Google.</li>
        <li>Údaje o vaší firmě, zákaznících a fakturách, které do aplikace zadáte.</li>
        <li>Přístupové údaje k e-mailové schránce, pokud nastavíte odesílání faktur. Jsou uloženy šifrovaně.</li>
      </ul>
      <h2 className="mb-2 mt-8 text-lg font-medium">Jak údaje používáme</h2>
      <p className="mb-4">
        Výhradně k poskytování služby: přihlášení, vystavení faktury, její odeslání
        zákazníkovi a evidence úhrad. Údaje neprodáváme ani nepředáváme třetím stranám
        pro marketing.
      </p>
      <h2 className="mb-2 mt-8 text-lg font-medium">Uložení a smazání</h2>
      <p className="mb-4">
        Data jsou uložena u poskytovatelů hostingu a databáze (Vercel, Neon) v EU nebo USA.
        Svůj účet včetně všech dat můžete kdykoliv smazat v nastavení aplikace nebo
        žádostí na kontaktní e-mail.
      </p>
      <h2 className="mb-2 mt-8 text-lg font-medium">Kontakt</h2>
      <p>Provozovatel: David Nekolný. Dotazy k ochraně údajů posílejte na e-mail uvedený v aplikaci.</p>
    </main>
  );
}
