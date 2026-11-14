import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title:"ClassOrbit | Find the right coaching", description:"Discover coaching institutes, compare courses and find your learning path." };
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
