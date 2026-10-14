import { Link } from 'react-router-dom'
import { FoodExpressLogo } from '../ui/Logo'
import type { AppSetting } from '../../types'

interface Props {
  brand: AppSetting
}

export function Footer({ brand }: Props) {
  return (
    <footer className="border-t border-[#E6E6EA] bg-white py-8">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-3">
              <FoodExpressLogo brand={brand} size={42} />
              <span className="font-extrabold text-[#111]">{brand.siteName ?? 'FoodExpress'}</span>
            </div>
            <p className="text-sm text-[#6B7280] leading-relaxed">{brand.tagline}</p>
            <p className="text-xs text-[#6B7280] mt-2">{brand.addressLine}</p>
          </div>
          <div>
            <h4 className="font-bold text-sm text-[#111] mb-3">Customers</h4>
            <ul className="space-y-2 text-sm text-[#6B7280]">
              <li><Link to="/" className="hover:text-[#D70F64] transition">Home</Link></li>
              <li><Link to="/orders" className="hover:text-[#D70F64] transition">My orders</Link></li>
              <li><Link to="/account/login" className="hover:text-[#D70F64] transition">Sign in</Link></li>
              <li><Link to="/account/register" className="hover:text-[#D70F64] transition">Join</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-sm text-[#111] mb-3">Partners</h4>
            <ul className="space-y-2 text-sm text-[#6B7280]">
              <li><Link to="/restaurant/partner" className="hover:text-[#D70F64] transition">Become a restaurant</Link></li>
              <li><Link to="/rider/join" className="hover:text-[#D70F64] transition">Become a rider</Link></li>
              <li><Link to="/admin" className="hover:text-[#D70F64] transition">Admin portal</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-[#E6E6EA] mt-6 pt-4 text-center text-xs text-[#6B7280]">
          {brand.footerText ?? 'FoodExpress — Fast • Fresh • For You'}
        </div>
      </div>
    </footer>
  )
}
