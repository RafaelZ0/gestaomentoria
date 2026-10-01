import { login } from "@/app/actions/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <h1 className="font-serif text-[32px] font-medium tracking-[-0.015em] text-text">
          Gestão de Tráfego
        </h1>
        <p className="mt-1 text-sm text-muted">Entre com a conta compartilhada da equipe.</p>

        {error && <p className="mt-5 text-sm text-danger">{error}</p>}

        <form action={login} className="mt-8 flex flex-col gap-4">
          <input type="hidden" name="next" value={next ?? "/inicio"} />
          <div>
            <label className="rotulo mb-1.5" htmlFor="email">
              E-mail
            </label>
            <input id="email" name="email" type="email" required autoComplete="email" className="campo" />
          </div>
          <div>
            <label className="rotulo mb-1.5" htmlFor="password">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="campo"
            />
          </div>
          <button type="submit" className="btn-primary mt-2 w-full">
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
