import { runRecurring } from "@/lib/recurring";
import { runReminders } from "@/lib/reminders";

export const maxDuration = 300;

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const recurring = await runRecurring();
  const reminders = await runReminders();
  return Response.json({ processed: recurring.length, results: recurring, reminders });
}
