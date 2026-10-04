"use client";

import React, { useEffect, useRef, useState } from "react";
import { WarningCircle } from "@phosphor-icons/react";
import { useCookSession } from "../../context/CookSessionContext";
import { TextField } from "../tide/FormParts";

type LoginErrors = Partial<Record<"username" | "password", string>>;

function validate(username: string, password: string): LoginErrors {
  const errors: LoginErrors = {};
  if (username.trim() === "") errors.username = "Enter your username.";
  if (password === "") errors.password = "Enter your password.";
  return errors;
}

/** Signed-out entry: the band carries the product name; one short form below it. */
export default function LoginScreen() {
  const { username, setUsername, password, setPassword, authError, isLoggingIn, handleLogin } = useCookSession();
  const [errors, setErrors] = useState<LoginErrors>({});
  const [failedSubmits, setFailedSubmits] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  // After a failed submit renders its errors, move focus to the first invalid field.
  useEffect(() => {
    if (failedSubmits > 0) formRef.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
  }, [failedSubmits]);

  const onSubmit = (e: React.FormEvent) => {
    const found = validate(username, password);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      e.preventDefault();
      setFailedSubmits((n) => n + 1);
      return;
    }
    void handleLogin(e);
  };

  return (
    <div className="tide-world min-h-[100dvh]">
      <header className="tide-band">
        <div className="mx-auto max-w-[1200px] px-5 pb-4 pt-[max(env(safe-area-inset-top),18px)] md:px-10">
          <h1 className="pt-2 text-[17px] font-semibold">FireBoard Pitmaster</h1>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-5 py-8 md:px-10 md:py-12">
        <form ref={formRef} onSubmit={onSubmit} noValidate className="max-w-[400px]">
          <h2 className="text-[22px] font-bold leading-tight [font-stretch:85%]">Sign in</h2>
          <p className="mt-2 text-[15px] text-tide-muted">Cooks keep recording while you&apos;re signed out. The forecast and pull alarm are here.</p>

          <div className="mt-6 grid gap-5">
            <TextField
              label="Username"
              value={username}
              onChange={(v) => {
                setUsername(v);
                setErrors((prev) => ({ ...prev, username: undefined }));
              }}
              error={errors.username}
              autoComplete="username"
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(v) => {
                setPassword(v);
                setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              error={errors.password}
              autoComplete="current-password"
            />
          </div>

          {authError && (
            <p role="alert" className="mt-5 flex items-start gap-2 text-[15px] font-semibold">
              <WarningCircle size={20} weight="bold" className="mt-px shrink-0" aria-hidden="true" />
              {authError}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoggingIn}
            className="mt-6 min-h-[56px] w-full rounded-[10px] bg-tide-ink px-5 text-[17px] font-bold text-tide-ground transition-transform hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoggingIn ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </main>
    </div>
  );
}
