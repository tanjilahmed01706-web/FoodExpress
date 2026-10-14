import { Outlet } from 'react-router-dom'

export function CustomerLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F6F6F8]">
      <Outlet />
    </div>
  )
}
