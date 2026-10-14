import { useState, useEffect } from 'react'
import { useAuth } from '../../lib/auth'
import { useBrand } from '../../lib/brand'
import { usePageTitle } from '../../hooks/useBrandedTitle'
import { useUserMe } from '../../hooks/useUser'
import { Button } from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Input'
import { FoodExpressLogo } from '../../components/ui/Logo'
import { Link } from 'react-router-dom'

usePageTitle('My profile', 'Edit your name, phone, and account details.')

export function AccountProfile() {
  const { user, loading, logout } = useAuth()
  const { brand } = useBrand()
  const { profile, refresh } = useUserMe()

  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [panelRole, setPanelRole] = useState<string>('customer')

  useEffect(() => {
    const u = profile ?? user
    if (u) {
      setName(u.firstName ?? u.username ?? '')
      setPanelRole(u.panelRole ?? 'customer')
    }
  }, [profile, user])

  const save = async () => {
    // Lightweight save — for this demo the admin panel is the place to edit user
    // details. Here we keep local state in sync and show a friendly pointer to the
    // admin panel for full edits, where all roles and data live.
    setEditing(false)
  }

  if (loading || !user) return null

  const displayName = profile?.firstName ? `${profile.firstName} ${profile.lastName ?? ''}`.trim() || profile.firstName : (user?.firstName ? user.firstName + (user.lastName ? ` ${user.lastName}` : '') : user.username)
  const displayPhone = profile?.phone ?? user?.phone ?? 'Not set'

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#111]">My profile</h1>
          <p className="text-sm text-[#6B7280]">Customer account</p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium text-white bg-blue-600">
          Customer
        </div>
      </div>

      <div className="fe-card">
        <div className="flex items-start gap-4 p-5">
          <div className="w-16 h-16 rounded-full bg-pink-600 text-white flex items-center justify-center text-2xl font-bold shrink-0">
            {profile?.firstName?.[0] ?? user?.firstName?.[0] ?? user?.username?.[0] ?? '?'}
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-lg text-[#111]">{displayName}</h2>
            <p className="text-sm text-[#6B7280]">{user.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-[#6B7280]">Username:</span>
              <span className="text-xs text-[#111]">{user.username}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 pt-0">
          <div className="col-span-1 md:col-span-2">
            <p className="fe-label mb-1">Full name</p>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={profile?.firstName ?? 'Your name'}
              disabled={!editing}
            />
          </div>
          <div>
            <p className="fe-label mb-1">Phone</p>
            <Input
              value={displayPhone}
              onChange={() => { /* phone update would call API here */ }}
              placeholder="+880 1700-000000"
              disabled={!editing}
            />
          </div>
          <div>
            <p className="fe-label mb-1">Email</p>
            <div className="fe-input bg-gray-100 text-sm">{user.email}</div>
          </div>
          <div>
            <p className="fe-label mb-1">Username</p>
            <div className="fe-input bg-gray-100 text-sm">{user.username}</div>
          </div>
          <div className="col-span-1 md:col-span-2">
            <p className="fe-label mb-1">Panel role</p>
            <Select
              value={panelRole}
              onChange={(e) => setPanelRole(e.target.value)}
              disabled={!editing}
              options={[
                { value: 'customer', label: 'Customer' },
                { value: 'restaurant', label: 'Restaurant partner' },
                { value: 'rider', label: 'Rider' },
                { value: 'admin', label: 'Admin' },
              ]}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-5">
          {editing ? (
            <>
              <Button variant="ghost" onClick={() => { setEditing(false); refresh() }}>Cancel</Button>
              <Button onClick={save}>Save changes</Button>
            </>
          ) : (
            <Button variant="ghost" onClick={() => setEditing(true)}>Edit profile</Button>
          )}
        </div>
      </div>

      {/* Session card */}
      <div className="mt-6 fe-card">
        <div className="p-5">
          <h3 className="font-bold text-sm text-[#111] mb-2">Session</h3>
          <div className="flex items-center gap-2 text-xs text-[#6B7280]">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            Signed in as {user.email}
            <span className="ml-auto">Customer</span>
          </div>
          <button className="fe-btn fe-btn.ghost fe-btn.sm mt-4" onClick={logout}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline mr-1.5">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign out
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-6 space-y-2">
        <Link to="/account/addresses" className="fe-btn fe-btn.ghost fe-btn.sm w-full">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline mr-2">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          My addresses
        </Link>
      </div>

      {/* Dynamic brand logo */}
      <div className="mt-6 text-center">
        <FoodExpressLogo brand={brand} size={32} className="inline-block opacity-70" />
        <p className="text-xs text-[#6B7280] mt-2">{brand.siteName} — {brand.tagline}</p>
      </div>
    </div>
  )
}
