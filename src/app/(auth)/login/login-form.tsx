"use client";

import { useActionState, useState } from "react";
import { CircleAlert, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { getDictionary } from "@/lib/i18n";
import { loginAction } from "@/server/actions/auth";
import styles from "./login.module.css";

type LoginFormProps = {
  notice?: string;
};

export function LoginForm({ notice }: LoginFormProps) {
  const t = getDictionary();
  const [state, formAction, pending] = useActionState(loginAction, {});
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className={styles.form}>
      {notice ? (
        <p className={styles.notice} role="status">
          {notice}
        </p>
      ) : null}

      {state.formError ? (
        <p className={styles.formError} role="alert">
          <CircleAlert aria-hidden="true" size={16} />
          {state.formError}
        </p>
      ) : null}

      <Field
        htmlFor="username"
        label={t.auth.username}
        error={state.usernameError}
        className={styles.field}
      >
        <Input
          name="username"
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          aria-required="true"
          autoFocus
        />
      </Field>

      <Field
        htmlFor="password"
        label={t.auth.password}
        error={state.passwordError}
        className={styles.field}
        action={
          <button
            type="button"
            className={styles.toggle}
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? t.auth.hidePassword : t.auth.showPassword}
            aria-pressed={showPassword}
          >
            {showPassword ? (
              <EyeOff aria-hidden="true" size={18} />
            ) : (
              <Eye aria-hidden="true" size={18} />
            )}
          </button>
        }
      >
        <Input
          name="password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          aria-required="true"
          className={styles.passwordInput}
        />
      </Field>

      <Button type="submit" loading={pending} className={styles.submit}>
        {t.auth.submit}
      </Button>
    </form>
  );
}
