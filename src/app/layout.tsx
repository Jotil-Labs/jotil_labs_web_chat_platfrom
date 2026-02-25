import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Jotil Chat',
  description: 'Embeddable AI chat widget for business websites',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
