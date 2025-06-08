import "./globals.css";
import { Sour_Gummy } from 'next/font/google'

const sourGummy = Sour_Gummy({
  subsets: ['latin'],
  weight: ['400'],
  display: 'swap',
})

export const metadata = {
  title: "Weather App",
  keywords: ["weather", "app", "next.js", "react"],
  description: "A weather app built with Next.js and React",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={sourGummy.className}
      >
        {children}
      </body>
    </html>
  );
}
