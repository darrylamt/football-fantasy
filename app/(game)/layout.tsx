import Nav from '@/components/ui/Nav'

export default function GameLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f4f4f6]">
      <Nav />
      <main className="max-w-5xl mx-auto px-4 py-8 pb-24 md:pb-8">{children}</main>
    </div>
  )
}
