import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GrupoTabs } from "@/components/GrupoTabs";
import { GrupoCabecalho } from "@/components/GrupoCabecalho";
import { getGrupo, getSaudeGrupo } from "@/lib/data/grupo";

export default async function GrupoLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const [grupo, saude, { data: responsaveis }] = await Promise.all([
    getGrupo(id),
    getSaudeGrupo(id),
    supabase.from("responsaveis").select("id, nome").order("nome"),
  ]);

  if (!grupo) notFound();

  const pabloId =
    (responsaveis ?? []).find((r) => r.nome.trim().toLowerCase() === "pablo")?.id ?? null;

  return (
    <div className="mx-auto flex max-w-[960px] flex-col gap-8">
      <GrupoCabecalho
        grupo={grupo}
        saude={saude}
        responsaveis={(responsaveis ?? []).map((r) => ({
          id: r.id,
          nome: r.id === pabloId ? "Dr. Pablo" : r.nome,
        }))}
        pabloId={pabloId}
        hoje={new Date().toISOString().slice(0, 10)}
      />

      <GrupoTabs grupoId={grupo.id} />

      <div>{children}</div>
    </div>
  );
}
