"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  // Só aceita caminho interno ("/algo"); "//site.com" ou "https://..." viram
  // a página inicial, pra um link de login não levar pra fora do sistema.
  const nextBruto = String(formData.get("next") ?? "/inicio");
  const next =
    nextBruto.startsWith("/") && !nextBruto.startsWith("//") && !nextBruto.startsWith("/\\")
      ? nextBruto
      : "/inicio";

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`);
  }

  redirect(next);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
