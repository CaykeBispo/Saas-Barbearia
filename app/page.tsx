import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-bold">Agenda IA</h1>
      <p className="mt-2 text-gray-600">
        Plataforma de agendamento com IA para barbearias e salões.
      </p>

      <div className="mt-8 rounded-lg border border-gray-200 p-4">
        <p className="text-sm text-gray-500">
          Cada barbearia tem seu próprio endereço pelo slug. Exemplo:
        </p>
        <Link
          href="/barbearia-do-joao/agenda"
          className="mt-2 inline-block font-medium text-blue-600 hover:underline"
        >
          /barbearia-do-joao/agenda →
        </Link>
      </div>
    </main>
  );
}
