import Nav from '@/components/ui/Nav'

export default function GameLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
