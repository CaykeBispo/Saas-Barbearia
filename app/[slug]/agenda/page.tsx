import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Agendamento, Cliente } from "@/lib/types";

// Início e fim do dia de hoje (no fuso do servidor), em ISO.
function faixaDeHoje() {
  const agora = new Date();
  const inicio = new Date(agora);
  inicio.setHours(0, 0, 0, 0);
  const fim = new Date(agora);
  fim.setHours(23, 59, 59, 999);
  return { inicio: inicio.toISOString(), fim: fim.toISOString() };
}

function horaCurta(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

type AgendaRow = Agendamento & { clientes: Pick<Cliente, "nome"> | null };

export default async function AgendaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // 1) Acha a barbearia pelo slug (o "tenant").
  const { data: barbearia } = await supabase
    .from("barbearias")
    .select("id, nome, slug")
    .eq("slug", slug)
    .single();

  if (!barbearia) notFound();

  // 2) Lê os agendamentos de HOJE dessa barbearia (isolado por barbearia_id).
  const { inicio, fim } = faixaDeHoje();
  const { data: agendamentos } = await supabase
    .from("agendamentos")
    .select("*, clientes(nome)")
    .eq("barbearia_id", barbearia.id)
    .gte("inicio", inicio)
    .lte("inicio", fim)
    .order("inicio", { ascending: true });

  const linhas = (agendamentos ?? []) as AgendaRow[];

  // Server Action: grava um novo agendamento no Supabase.
  async function criarAgendamento(formData: FormData) {
    "use server";

    const nomeCliente = String(formData.get("cliente") || "").trim();
    const hora = String(formData.get("hora") || "").trim(); // "HH:MM"
    if (!nomeCliente || !hora) return;

    // Monta o horário de início a partir da hora escolhida (dia de hoje).
    const [h, m] = hora.split(":").map(Number);
    const inicioDt = new Date();
    inicioDt.setHours(h, m, 0, 0);
    const fimDt = new Date(inicioDt.getTime() + 30 * 60 * 1000); // +30 min

    // Cria o cliente (simples, no MVP) já vinculado à barbearia.
    const { data: cliente } = await supabase
      .from("clientes")
      .insert({ barbearia_id: barbearia!.id, nome: nomeCliente })
      .select("id")
      .single();

    // Cria o agendamento.
    await supabase.from("agendamentos").insert({
      barbearia_id: barbearia!.id,
      cliente_id: cliente?.id ?? null,
      inicio: inicioDt.toISOString(),
      fim: fimDt.toISOString(),
      status: "confirmado",
    });

    // Recarrega a lista.
    revalidatePath(`/${slug}/agenda`);
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-bold">{barbearia.nome}</h1>
      <p className="text-gray-600">Agenda de hoje</p>

      {/* Formulário de novo agendamento */}
      <form action={criarAgendamento} className="mt-6 flex flex-wrap gap-2">
        <input
          name="cliente"
          placeholder="Nome do cliente"
          required
          className="flex-1 rounded border border-gray-300 px-3 py-2"
        />
        <input
          name="hora"
          type="time"
          required
          className="rounded border border-gray-300 px-3 py-2"
        />
        <button
          type="submit"
          className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
        >
          Agendar
        </button>
      </form>

      {/* Tabela de horários do dia */}
      <table className="mt-8 w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-gray-300 text-sm text-gray-500">
            <th className="py-2">Hora</th>
            <th className="py-2">Cliente</th>
            <th className="py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {linhas.length === 0 ? (
            <tr>
              <td colSpan={3} className="py-6 text-center text-gray-400">
                Nenhum horário marcado para hoje.
              </td>
            </tr>
          ) : (
            linhas.map((a) => (
              <tr key={a.id} className="border-b border-gray-100">
                <td className="py-2 font-medium">{horaCurta(a.inicio)}</td>
                <td className="py-2">{a.clientes?.nome ?? "—"}</td>
                <td className="py-2 text-sm text-gray-600">{a.status}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </main>
  );
}
