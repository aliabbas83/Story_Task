import "./globals.css";

export const metadata = { title: "Story Machine", description: "Give it a spark. Choose your own adventure." };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
