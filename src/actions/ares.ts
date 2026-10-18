"use server";

import { searchAres } from "@/lib/ares";
import { requireSession } from "@/lib/session";

export async function aresSearchAction(query: string) {
  await requireSession();
  return searchAres(query);
}
