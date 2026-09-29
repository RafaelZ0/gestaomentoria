import { login } from "@/app/actions/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm rounded-xl border border-line bg-surface p-8">
        <h1 className="font-display text-2xl font-semibold text-text">
          Gestão de Tráfego
        </h1>
        <p className="mt-1 text-sm text-text-2">
          Entre com a conta compartilhada da equipe.
        </p>

        {error && (
          <div className="mt-4 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </div>
        )}

        <form action={login} className="mt-6 space-y-4">
          <input type="hidden" name="next" value={next ?? "/grupos"} />
          <div>
            <label className="block text-sm text-text-2 mb-1" htmlFor="email">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="campo w-full"
            />
          </div>
          <div>
            <label className="block text-sm text-text-2 mb-1" htmlFor="password">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="campo w-full"
            />
          </div>
          <button
            type="submit"
            className="btn-secondary w-full"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
