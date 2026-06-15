"use client";

import { useActionState } from "react";
import { ModalLogo } from "@/components/ModalLogo";
import { loginAction, type LoginState } from "@/app/actions/auth";
import { Lock } from "lucide-react";

const initialState: LoginState = {};

type Props = {
  redirectFrom?: string;
};

export function LoginForm({ redirectFrom }: Props) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      <div className="silver-ring w-full max-w-sm rounded-2xl border border-[#1e2430] bg-[#0e1016] p-8">
        <div className="mb-8 flex justify-center">
          <ModalLogo size="sm" />
        </div>

        <form action={formAction} className="space-y-5">
          {redirectFrom ? (
            <input type="hidden" name="from" value={redirectFrom} />
          ) : null}

          <div>
            <label
              htmlFor="password"
              className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-[#6b7280]"
            >
              <Lock className="h-3.5 w-3.5" />
              Admin password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              autoFocus
              className="w-full rounded-xl border border-[#1e2430] bg-[#07080b] px-4 py-3 text-[#e8eaed] outline-none transition-colors placeholder:text-[#4b5563] focus:border-[#c0c5ce]/35"
              placeholder="Enter password"
            />
          </div>

          {state.error ? (
            <p className="text-sm text-red-400" role="alert">
              {state.error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl border border-[#c0c5ce]/20 bg-linear-to-r from-[#1a1d24] to-[#141820] py-3 text-sm font-medium text-[#e8eaed] transition-opacity hover:border-[#c0c5ce]/35 disabled:opacity-60"
          >
            {pending ? "Signing in…" : "Enter MODAL"}
          </button>
        </form>
      </div>

      <p className="mt-8 text-center text-xs text-[#6b7280]">
        Restricted access · Halloway & Associates
      </p>
    </div>
  );
}
