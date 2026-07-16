import { login } from "@/app/actions/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-base px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-bg-surface p-8">
        <h1 className="font-display text-2xl font-semibold text-text-primary">
          Gestão de Tráfego
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Entre com a conta compartilhada da equipe.
        </p>

        {error && (
          <div className="mt-4 rounded-lg bg-status-alert-bg px-3 py-2 text-sm text-status-alert-text">
            {error}
          </div>
        )}

        <form action={login} className="mt-6 space-y-4">
          <input type="hidden" name="next" value={next ?? "/grupos"} />
          <div>
            <label className="block text-sm text-text-secondary mb-1" htmlFor="email">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-lg border border-border bg-bg-surface-hover px-3 py-2 text-text-primary outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1" htmlFor="password">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full rounded-lg border border-border bg-bg-surface-hover px-3 py-2 text-text-primary outline-none focus:border-accent"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-accent px-3 py-2 font-medium text-white transition-colors hover:bg-accent-hover"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
