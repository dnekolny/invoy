"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/form/field";
import { Card, CardContent } from "@/components/ui/card";

export function LoginForm() {
  const t = useTranslations("login");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [busy, setBusy] = useState(false);

  async function google() {
    setBusy(true);
    await authClient.signIn.social({ provider: "google", callbackURL: "/dashboard" });
  }

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await authClient.emailOtp.sendVerificationOtp({ email, type: "sign-in" });
    setBusy(false);
    if (error) return toast.error(t("errorSend"));
    setStep("otp");
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await authClient.signIn.emailOtp({ email, otp });
    setBusy(false);
    if (error) return toast.error(t("errorVerify"));
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <Button variant="outline" className="w-full" onClick={google} disabled={busy}>
          <GoogleIcon />
          {t("google")}
        </Button>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          {t("or")}
          <div className="h-px flex-1 bg-border" />
        </div>
        {step === "email" ? (
          <form onSubmit={sendCode} className="space-y-3">
            <Field label={t("email")} name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jmeno@firma.cz" />
            <Button type="submit" className="w-full" disabled={busy}>
              {t("sendCode")}
            </Button>
          </form>
        ) : (
          <form onSubmit={verify} className="space-y-3">
            <p className="text-sm text-muted-foreground">{t("codeSent", { email })}</p>
            <Field
              label={t("code")}
              name="otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              required
              autoFocus
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="font-mono tracking-[0.3em]"
            />
            <Button type="submit" className="w-full" disabled={busy || otp.length !== 6}>
              {t("verify")}
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={() => setStep("email")}>
              {t("back")}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z" />
    </svg>
  );
}
