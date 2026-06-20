import type { Metadata } from "next";
import { RootShell } from "@/components/root-shell";
import "./globals.css";

export const metadata: Metadata = { title: { default: "SyncField", template: "%s | SyncField" }, description: "Construction operations, synchronized." };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><RootShell>{children}</RootShell></body></html>;
}
