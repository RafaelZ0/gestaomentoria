import Link from "next/link";
import { NovoGrupoForm } from "@/components/NovoGrupoForm";
import { PageHeader } from "@/components/ui/PageHeader";

export default function NovoGrupoPage() {
  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-9">
      <div className="flex flex-col gap-3.5">
        <Link href="/grupos" prefetch={false} className="w-fit text-[13px] text-subtle hover:text-text">
          Grupos de gestão
        </Link>
        <PageHeader titulo="Novo grupo de gestão" />
      </div>
      <NovoGrupoForm />
    </div>
  );
}
