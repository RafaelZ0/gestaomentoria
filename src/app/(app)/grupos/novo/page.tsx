import { NovoGrupoForm } from "@/components/NovoGrupoForm";

export default function NovoGrupoPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-semibold text-text-primary">
        Novo grupo de gestão
      </h1>
      <div className="mt-6">
        <NovoGrupoForm />
      </div>
    </div>
  );
}
