"use server";

import { lookupAres } from "@/lib/ares";
import { requireSession } from "@/lib/session";

export async function aresLookupAction(ico: string) {
  await requireSession();
  return lookupAres(ico);
}
