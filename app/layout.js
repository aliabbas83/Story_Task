import "./globals.css";

export const metadata = { title: "A Kuwaiti from the Future", description: "An interactive story inspired by Mohammed Al-Sharekh and the Sakhr computer." };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
