import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  StatusBadge,
  statusGrupoVariant,
} from "@/components/StatusBadge";
import { GrupoTabs } from "@/components/GrupoTabs";
import { NomeGrupoField } from "@/components/NomeGrupoField";

export default async function GrupoLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: grupo } = await supabase
    .from("grupos_gestao")
    .select("*")
    .eq("id", id)
    .single();

  if (!grupo) notFound();

  return (
    <div className="max-w-5xl">
      <Link href="/grupos" className="text-sm text-text-secondary hover:text-text-primary">
        ← Grupos de gestão
      </Link>

      <div className="mt-2 flex items-center gap-3">
        <NomeGrupoField grupoId={grupo.id} nome={grupo.nome} />
        <StatusBadge label={grupo.status} variant={statusGrupoVariant(grupo.status)} />
      </div>

      <GrupoTabs grupoId={grupo.id} />

      <div className="mt-6">{children}</div>
    </div>
  );
}
