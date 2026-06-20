import './globals.css'

export const metadata = {
  title: 'Supply Alpha — Indirect Intelligence Platform',
  description: 'Discover the companies behind the biggest trends. Map ecosystems, track federal contracts, and analyze indirect exposure across AI Infrastructure, Defense Tech, Space Economy and more.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
