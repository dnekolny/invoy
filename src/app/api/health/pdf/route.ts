import { htmlToPdf } from "@/lib/pdf";

export const maxDuration = 60;

export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return new Response("Unauthorized", { status: 401 });
  const started = Date.now();
  try {
    const pdf = await htmlToPdf(`<!doctype html><html><body style="font-family:sans-serif"><h1>Invoy PDF health – ěščřžýáíé</h1></body></html>`);
    return Response.json({ ok: true, bytes: pdf.length, ms: Date.now() - started });
  } catch (e) {
    return Response.json({ ok: false, error: (e as Error).message, ms: Date.now() - started }, { status: 500 });
  }
}
