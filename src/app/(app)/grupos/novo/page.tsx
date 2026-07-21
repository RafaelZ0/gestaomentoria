import { NovoGrupoForm } from "@/components/NovoGrupoForm";

export default function NovoGrupoPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-text-primary">
        Novo grupo de gestão
      </h1>
      <div className="mt-6">
        <NovoGrupoForm />
      </div>
    </div>
  );
}
