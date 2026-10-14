import { Link } from 'react-router-dom'
import { useBrand } from '../lib/brand'
import { FoodExpressLogo } from '../components/ui/Logo'

export function NotFoundPage() {
  const { brand } = useBrand()
  return (
    <div className="flex flex-col items-center justify-center text-center px-4 py-20 flex-1">
      <div className="w-20 h-20 rounded-full bg-[#F2EEFF] flex items-center justify-center mb-5 shadow-sm">
        <FoodExpressLogo brand={brand} size={40} className="!rounded-full" />
      </div>
      <h1 className="font-extrabold text-4xl text-[#111] mb-2">404</h1>
      <p className="text-lg text-[#6B7280] max-w-xs">
        Oops! This page doesn’t exist on <span className="font-bold text-[#D70F64]">{brand.siteName ?? 'FoodExpress'}</span>.
      </p>
      <div className="flex gap-3 mt-6">
        <Link to="/" className="fe-btn fe-btn.primary fe-btn.sm">Back to home</Link>
        <Link to="/orders" className="fe-btn fe-btn.ghost fe-btn.sm">My orders</Link>
      </div>
    </div>
  )
}
