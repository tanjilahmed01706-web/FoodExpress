import { useState, useEffect } from 'react'
import { usePageTitle } from '../../hooks/useBrandedTitle'
import { Chip } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Input'
import type { Ticket } from '../../types'

usePageTitle('Support tickets', 'View and reply to customer support tickets.')

export function AdminTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'replied' | 'closed'>('all')
  const [replyTo, setReplyTo] = useState<Ticket | null>(null)
  const [replyMessage, setReplyMessage] = useState('')

  useEffect(() => {
    let cancelled = false
    fetchTickets()
      .then((t) => { if (!cancelled) setTickets(t.data ?? []) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const filtered = tickets.filter((t) => statusFilter === 'all' || t.status === statusFilter)

  const sendReply = async (ticket: Ticket) => {
    if (!replyMessage.trim()) return
    const newReplies = [...ticket.replies, { message: replyMessage, by: 'admin' as const }]
    const updated: Ticket = { ...ticket, status: 'replied', replies: newReplies }
    setTickets((prev) => prev.map((x) => (x.documentId === ticket.documentId ? updated : x)))
    setReplyMessage('')
    setReplyTo(null)
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-[#111]">Support tickets</h2>
          <p className="text-sm text-[#6B7280]">{tickets.length} tickets · {tickets.filter((t) => t.status === 'open').length} open</p>
        </div>
      </div>

      <div className="admin-filter-bar">
        <div className="admin-filter-field">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            options={[
              { value: 'all', label: 'All' },
              { value: 'open', label: 'Open' },
              { value: 'replied', label: 'Replied' },
              { value: 'closed', label: 'Closed' },
            ]}
          />
        </div>
      </div>

      <div className="admin-two-col">
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">Tickets</h3>
          </div>
          <div className="admin-card-body">
            {loading ? (
              <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="admin-skeleton h-16 w-full" />)}</div>
            ) : (
              <div className="space-y-2">
                {filtered.map((t) => (
                  <div
                    key={t.documentId}
                    className="admin-ticket"
                    onClick={() => setReplyTo(t)}
                  >
                    <div className="admin-ticket-header">
                      <span className="admin-ticket-subject">{t.subject}</span>
                      <div className="flex items-center gap-2">
                        <Chip variant="outline" size="sm">{t.type}</Chip>
                        <Chip variant={t.status === 'open' ? 'primary' : t.status === 'closed' ? 'primary' : 'success'} size="sm">
                          {t.status}
                        </Chip>
                      </div>
                    </div>
                    <p className="admin-ticket-meta">
                      {t.user?.firstName ? `${t.user.firstName} ${t.user.lastName}` : 'Customer'}
                      {t.user?.email ? ` · ${t.user.email}` : ''}
                    </p>
                    <p className="admin-ticket-preview">{t.message.slice(0, 80)}{t.message.length > 80 ? '…' : ''}</p>
                    <div className="mt-1 text-xs text-[#6B7280]">{t.replies.length} {t.replies.length === 1 ? 'reply' : 'replies'}</div>
                  </div>
                ))}
              </div>
            )}
            {filtered.length === 0 && !loading && (
              <div className="admin-empty">
                <p className="admin-empty-title">No tickets found</p>
                <p className="admin-empty-desc">Select a filter or create a new ticket from the storefront.</p>
              </div>
            )}
          </div>
        </div>

        <div className="admin-reply">
          <h3 className="admin-reply-title">Reply to ticket</h3>
          {replyTo ? (
            <>
              <p className="text-xs text-[#6B7280] mb-2">{replyTo.subject}</p>
              <textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Write your reply here…"
              />
              <div className="admin-actions">
                <Button variant="ghost" size="sm" onClick={() => setReplyTo(null)}>Back</Button>
                <Button size="sm" onClick={() => sendReply(replyTo)} disabled={!replyMessage.trim()}>Send reply</Button>
              </div>

              {/* Conversation preview */}
              <div className="mt-4 pt-3 border-t border-[#E6E6EA]">
                <p className="text-xs text-[#6B7280] mb-2">Conversation</p>
                {replyTo.replies.map((r, i) => (
                  <div key={i} className={`mb-2 p-2 rounded-lg text-xs ${r.by === 'customer' ? 'bg-[#F6F6F8] text-[#6B7280]' : 'bg-[#F2EEFF] text-[#D70F64]'}`}>
                    <span className="font-medium block mb-0.5">{r.by === 'customer' ? 'Customer' : 'Admin'}</span>
                    {r.message}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-6 text-[#6B7280]">
              <p className="text-sm">Select a ticket to reply</p>
              <p className="text-xs mt-1">Click any ticket from the list.</p>
            </div>
          )}
        </div>
      </div>

      {filtered.length === 0 && !loading && (
        <div className="admin-empty">
          <p className="admin-empty-title">No tickets found</p>
        </div>
      )}
    </div>
  )
}

async function fetchTickets() {
  const res = await fetch(`${import.meta.env.VITE_STRAPI_URL ?? 'http://localhost:1337'}/api/tickets?sort=createdAt:desc&pagination[pageSize]=50`)
  return res.json()
}
