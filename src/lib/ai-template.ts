import Anthropic from "@anthropic-ai/sdk";

export const AI_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
export type AiImageType = (typeof AI_IMAGE_TYPES)[number];

export function aiConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

const SYSTEM = `You convert a picture of an invoice into an HTML invoice template for a Czech invoicing app. Output ONLY the HTML document, no explanation, no markdown fences.

Template language (Mustache-like):
- {{path}} inserts an HTML-escaped value, {{{path}}} inserts raw HTML (use for blocks.*, *Html and logo/qr data URLs).
- {{#if path}}...{{else}}...{{/if}} and {{#each lines}}...{{/each}} (inside each: {{index}}, {{name}}, {{quantity}}, {{unit}}, {{unitPrice}}, {{vatRate}}, {{net}}, {{vat}}, {{total}}).

Available values (already formatted and localized, cs or en):
title (Faktura / Zálohová faktura), lang, isProforma, isVatPayer, isTaxDoc, number, variableSymbol, currency, issueDate, taxDate, dueDate,
intro, introHtml, note, noteHtml, footerText, footerHtml, accent (hex color), logo (data URL or empty), qr (data URL or empty), watermark (text or empty),
supplier.{name,street,cityLine,countryName,ico,dic,email,phone,web,registrationNote}, customer.{name,street,cityLine,countryName,ico,dic,email},
bank.{account,iban,swift}, lines[], byRate[].{rate,base,vat}, totals.{subtotal,vatTotal,total,paid,remaining,hasPayment},
labels.{invoice,proforma,taxDoc,proformaNote,supplier,customer,ico,dic,notVatPayer,issueDate,taxDate,dueDate,paymentMethod,transfer,account,iban,swift,vs,qr,item,qty,unitPrice,vat,net,total,base,subtotal,vatTotal,totalDue,paid,remaining,note}.
Ready-made HTML blocks (raw, use {{{blocks.x}}}): blocks.css (base A4 CSS, include it in <style>), blocks.fonts (Inter font link), blocks.supplier, blocks.customer, blocks.lines (neutral header), blocks.linesAccent (accent header), blocks.totals (VAT breakdown + total, handles payments), blocks.payment, blocks.dates, blocks.intro, blocks.note, blocks.qr, blocks.watermark, blocks.footer.

Rules:
- Full document: <!doctype html><html lang="{{lang}}"><head><meta charset="utf-8">{{{blocks.fonts}}}<style>{{{blocks.css}}} ...your CSS...</style></head><body><div class="page">...</div></body></html>. The .page element is A4 (210mm, padding 16mm); keep everything inside it, single page, print-safe (no external images except {{{logo}}} and {{{qr}}}).
- Always use labels.* for captions so the template works in both languages. Never hardcode Czech or English captions, company data, numbers or dates: everything comes from placeholders.
- Must include a lines table ({{{blocks.lines}}}, {{{blocks.linesAccent}}} or your own {{#each lines}} table) and totals ({{{blocks.totals}}} or your own using totals.* and byRate; if you build your own totals, show VAT rows only inside {{#if isVatPayer}}).
- Include {{{blocks.watermark}}} right inside .page, {{{blocks.qr}}} near the payment details, {{{blocks.intro}}}, {{{blocks.note}}} and {{{blocks.footer}}} (or your own equivalents), and {{#if logo}}<img src="{{{logo}}}">{{/if}}.
- Use {{accent}} for the main color wherever the reference uses a brand color. Reproduce the layout, proportions, typography feel and color scheme of the picture as faithfully as practical; map the picture's content onto the placeholders instead of copying its text.`;

export async function generateInvoiceTemplate(input: { image?: { data: string; mediaType: AiImageType }; instructions?: string; previousHtml?: string }) {
  const client = new Anthropic();
  const content: Anthropic.MessageParam["content"] = [];
  if (input.image) content.push({ type: "image", source: { type: "base64", media_type: input.image.mediaType, data: input.image.data } });
  if (input.previousHtml) {
    content.push({ type: "text", text: `Here is the current template:\n\n${input.previousHtml}\n\nChange it according to these instructions and return the whole updated document:\n${input.instructions || "Improve fidelity to the picture."}` });
  } else if (!input.image) {
    throw new Error("image required");
  } else {
    content.push({ type: "text", text: `Create the template from this picture.${input.instructions ? `\n\nAdditional instructions from the user: ${input.instructions}` : ""}` });
  }
  const res = await client.messages.create({
    model: process.env.AI_MODEL || "claude-opus-5-5",
    max_tokens: 12000,
    system: SYSTEM,
    messages: [{ role: "user", content }],
  });
  const text = res.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("");
  const html = text.replace(/^\s*```(?:html)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  const start = html.indexOf("<!doctype");
  return start > 0 ? html.slice(start) : html;
}
