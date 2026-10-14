import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { Footer } from './Footer'
import { useBrand } from '../../lib/brand'

export function AppShell() {
  const { brand } = useBrand()
  return (
    <div className="min-h-screen flex flex-col bg-[#F6F6F8]">
      <Navbar />
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
      <Footer brand={brand} />
    </div>
  )
}
