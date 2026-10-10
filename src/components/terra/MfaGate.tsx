import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type State =
  | { kind: "loading" }
  | { kind: "ok" }
  | { kind: "enroll"; factorId: string; qr: string; secret: string }
  | { kind: "challenge"; factorId: string };

/** Requires a verified TOTP factor (AAL2) before rendering the admin portal. */
export function MfaGate({ children, onVerified }: { children: React.ReactNode; onVerified?: () => void }) {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [code, setCode] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function evaluate() {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.currentLevel === "aal2") {
      setState({ kind: "ok" });
      onVerified?.();
      return;
    }
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const verified = factors?.totp?.find((f) => f.status === "verified");
    if (verified) {
      setState({ kind: "challenge", factorId: verified.id });
      return;
    }
    // clean up stale unverified factors, then enroll fresh
    for (const f of factors?.all ?? []) {
      if (f.status !== "verified") await supabase.auth.mfa.unenroll({ factorId: f.id });
    }
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: `Admin ${Date.now()}` });
    if (error || !data) {
      setErr(error?.message ?? "Could not start MFA setup");
      return;
    }
    setState({ kind: "enroll", factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
  }

  useEffect(() => {
    evaluate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (state.kind !== "enroll" && state.kind !== "challenge") return;
    setBusy(true);
    setErr(null);
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: state.factorId, code: code.trim() });
    setBusy(false);
    if (error) {
      setErr("That code didn't work. Try the latest one from your app.");
      return;
    }
    setCode("");
    await evaluate();
  }

  if (state.kind === "ok") return <>{children}</>;

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-8 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.3)]">
        <div className="text-[10.5px] uppercase tracking-[0.28em] text-mist">Admin security</div>
        <h1 className="mt-3 font-display text-[1.6rem] tracking-tight">
          {state.kind === "enroll" ? "Set up two-factor sign-in" : "Enter your 6-digit code"}
        </h1>
        {state.kind === "loading" && !err && <p className="mt-4 text-sm text-mist">Checking…</p>}
        {state.kind === "enroll" && (
          <>
            <p className="mt-3 text-[13px] text-mist">
              Scan this with Google Authenticator, 1Password, Authy or similar, then enter the code it shows.
            </p>
            <img src={state.qr} alt="Authenticator QR code" className="mx-auto mt-5 h-44 w-44" />
            <p className="mt-3 break-all text-center font-mono text-[11px] text-mist">{state.secret}</p>
          </>
        )}
        {state.kind === "challenge" && (
          <p className="mt-3 text-[13px] text-mist">Open your authenticator app to continue to the admin portal.</p>
        )}
        {(state.kind === "enroll" || state.kind === "challenge") && (
          <form onSubmit={verify} className="mt-6 grid gap-3">
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="rounded-xl border border-black/10 px-4 py-3 text-center font-mono text-[18px] tracking-[0.4em] outline-none focus:border-ink"
              placeholder="000000"
            />
            <button disabled={busy || code.length !== 6} className="rounded-full bg-ink px-6 py-3 text-[13px] text-white disabled:opacity-60">
              {busy ? "Verifying…" : "Verify"}
            </button>
          </form>
        )}
        {err && <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-[12.5px] text-red-700">{err}</div>}
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.href = "/auth";
          }}
          className="mt-6 text-[12px] text-mist hover:text-ink"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
