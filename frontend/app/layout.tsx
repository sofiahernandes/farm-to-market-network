import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "AgriTech · Do campo à sua porta", template: "%s · AgriTech" },
  description: "Catálogo, sacola e pedidos persistidos para compras locais. Gateway fake sandbox e backend SQLite sandbox.",
  applicationName: "AgriTech",
  keywords: ["agricultura local", "cestas", "produtores", "alimentos"],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
