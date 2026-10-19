export type Bank = { code: string; name: string; swift: string };

export const CZ_BANKS: Bank[] = [
  { code: "0100", name: "Komerční banka", swift: "KOMBCZPP" },
  { code: "0300", name: "ČSOB", swift: "CEKOCZPP" },
  { code: "0600", name: "MONETA Money Bank", swift: "AGBACZPP" },
  { code: "0710", name: "Česká národní banka", swift: "CNBACZPP" },
  { code: "0800", name: "Česká spořitelna", swift: "GIBACZPX" },
  { code: "2010", name: "Fio banka", swift: "FIOBCZPP" },
  { code: "2060", name: "Citfin", swift: "CITFCZPP" },
  { code: "2070", name: "TRINITY BANK", swift: "MPUBCZPP" },
  { code: "2250", name: "Banka CREDITAS", swift: "CTASCZ22" },
  { code: "2600", name: "Citibank Europe", swift: "CITICZPX" },
  { code: "2700", name: "UniCredit Bank", swift: "BACXCZPP" },
  { code: "3030", name: "Air Bank", swift: "AIRACZPP" },
  { code: "4000", name: "Max banka", swift: "EXPNCZPP" },
  { code: "4300", name: "Národní rozvojová banka", swift: "NROZCZPP" },
  { code: "5500", name: "Raiffeisenbank", swift: "RZBCCZPP" },
  { code: "6000", name: "PPF banka", swift: "PMBPCZPP" },
  { code: "6210", name: "mBank", swift: "BREXCZPP" },
  { code: "6300", name: "BNP Paribas Fortis", swift: "GEBACZPP" },
  { code: "6700", name: "Všeobecná úverová banka", swift: "SUBACZPP" },
  { code: "7910", name: "Deutsche Bank", swift: "DEUTCZPX" },
  { code: "7940", name: "Waldviertler Sparkasse", swift: "SPWTCZ21" },
  { code: "8040", name: "Oberbank", swift: "OBKLCZ2X" },
  { code: "8090", name: "Česká exportní banka", swift: "CZEECZPP" },
  { code: "8150", name: "HSBC", swift: "HSBCCZPP" },
].sort((a, b) => a.name.localeCompare(b.name, "cs"));

export function bankByCode(code: string | null | undefined) {
  return CZ_BANKS.find((b) => b.code === code) ?? null;
}
