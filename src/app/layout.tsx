import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#166534",
};

export const metadata: Metadata = {
  title: "Compadre do CadUnico - Informes Simplificados",
  description:
    "Informacoes do Cadastro Unico em linguagem simples. Saiba se vale a pena ir ao CRAS hoje.",
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
    <html lang="pt-BR" className={`${geistSans.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        {/* Header - simples e grande pra celular */}
        <header className="bg-gradient-to-r from-green-800 to-green-600 text-white shadow-lg">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <Link href="/" className="group min-h-0">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight leading-tight">
                  Compadre do CadUnico
                </h1>
                <p className="text-green-200 text-xs sm:text-sm mt-0.5">
                  Informes do governo de um jeito simples
                </p>
              </Link>
              <nav>
                <Link
                  href="/cras-hoje"
                  className="px-3 py-2.5 sm:px-4 rounded-lg text-xs sm:text-sm font-bold bg-amber-500 text-white hover:bg-amber-400 active:bg-amber-600 transition-colors whitespace-nowrap shadow-md"
                >
                  Posso ir no CRAS?
                </Link>
              </nav>
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 max-w-3xl mx-auto px-4 py-6 sm:py-8 w-full">
          {children}
        </main>

        {/* Footer - simples */}
        <footer className="bg-gray-800 text-gray-300 mt-auto">
          <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
            <div className="space-y-4 text-sm">
              <div className="text-center">
                <h3 className="font-semibold text-white mb-1">
                  Compadre do CadUnico
                </h3>
                <p className="text-gray-400 leading-relaxed text-xs sm:text-sm">
                  Este site pega as informacoes oficiais do governo e coloca de
                  um jeito mais facil de entender. Nao e um site do governo.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm">
                <a
                  href="https://www.gov.br/mds/pt-br/acoes-e-programas/cadastro-unico"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors underline"
                >
                  Site oficial do CadUnico
                </a>
                <span className="hidden sm:inline text-gray-600">|</span>
                <a
                  href="https://www.gov.br/mds/pt-br/acoes-e-programas/cadastro-unico/informes"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors underline"
                >
                  Informes Oficiais do MDS
                </a>
              </div>

              <div className="border-t border-gray-700 pt-3">
                <p className="text-center text-xs text-gray-500">
                  Em caso de duvida, procure o CRAS mais perto da sua casa.
                </p>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
