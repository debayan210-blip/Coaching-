import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClassOrbit | Find your coaching",
  description: "Discover coaching centres, compare courses and request a seat.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
