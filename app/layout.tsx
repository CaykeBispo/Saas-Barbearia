import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agenda IA",
  description: "Agendamento com IA para barbearias e salões",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
