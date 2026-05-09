import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Compadre do CadUnico - Informes Simplificados",
  description:
    "Informacoes do Cadastro Unico e programas sociais em linguagem simples e acessivel. Descubra se vale a pena ir ao CRAS hoje.",
  keywords: [
    "CadUnico",
    "Cadastro Unico",
    "CRAS",
    "Bolsa Familia",
    "informes",
    "beneficios sociais",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        {/* Header */}
        <header className="bg-gradient-to-r from-green-800 to-green-600 text-white shadow-lg">
          <div className="max-w-5xl mx-auto px-4 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <Link href="/" className="group">
                <h1 className="text-2xl font-bold tracking-tight">
                  Compadre do CadUnico
                </h1>
                <p className="text-green-200 text-sm mt-0.5">
                  Informacao do governo na linguagem do povo
                </p>
              </Link>
              <nav className="flex items-center gap-1">
                <Link
                  href="/"
                  className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/15 transition-colors"
                >
                  Inicio
                </Link>
                <Link
                  href="/cras-hoje"
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-amber-500 text-white hover:bg-amber-400 transition-colors"
                >
                  Ir no CRAS hoje?
                </Link>
              </nav>
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-gray-800 text-gray-300 mt-auto">
          <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div>
                <h3 className="font-semibold text-white mb-2">
                  Compadre do CadUnico
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  Projeto que simplifica informacoes oficiais do Cadastro Unico
                  para facilitar o acesso da populacao.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">
                  Links Importantes
                </h3>
                <ul className="space-y-1.5">
                  <li>
                    <a
                      href="https://www.gov.br/mds/pt-br/acoes-e-programas/cadastro-unico"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-white transition-colors"
                    >
                      Cadastro Unico - gov.br
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://www.gov.br/mds/pt-br/acoes-e-programas/cadastro-unico/informes"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-white transition-colors"
                    >
                      Informes Oficiais
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">Aviso</h3>
                <p className="text-gray-400 leading-relaxed">
                  Este site nao e oficial do governo. As informacoes sao
                  extraidas e simplificadas a partir de documentos publicos. Em
                  caso de duvida, consulte seu CRAS.
                </p>
              </div>
            </div>
            <div className="border-t border-gray-700 mt-6 pt-4 text-center text-xs text-gray-500">
              Todas as informacoes possuem links para as fontes oficiais no
              gov.br
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
