import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card, CardBody, CardHeader } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { useToast } from '../components/Toast';
import { Select } from '../components/Select';
import { Textarea } from '../components/Input';
import { useAuth } from '../contexts/AuthContext';
import type { Ticket, TicketMessage } from '../services/api';
import * as api from '../services/api';

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [reply, setReply] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isInternal, setIsInternal] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const toast = useToast();
  const { user, permissions = [] } = useAuth();
  const canRespond = permissions.includes('ticket:respond');
  const canTakeOver = canRespond && ticket && !ticket.assignee_id && user?.id;

  const ticketId = id ? parseInt(id, 10) : 0;

  const load = async () => {
    if (!ticketId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getTicket(ticketId);
      setTicket(data.ticket);
      setMessages(data.messages);
      setStatus(data.ticket.status);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [ticketId]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketId || !reply.trim()) return;
    setSubmitting(true);
    try {
      await api.replyTicket(ticketId, reply.trim(), isInternal);
      setReply('');
      toast.success('Reply sent');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Reply failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTakeOver = async () => {
    if (!ticketId || !ticket) return;
    setAssigning(true);
    try {
      await api.assignTicket(ticketId);
      toast.success('You have taken over this ticket');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to take over');
    } finally {
      setAssigning(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!ticketId || newStatus === ticket?.status) return;
    try {
      await api.updateTicketStatus(ticketId, newStatus);
      setStatus(newStatus);
      toast.success('Status updated');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    }
  };

  if (loading || !ticket) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <PageHeader
        title={ticket.subject}
        subtitle={
          ticket.assignee_name
            ? `Ticket #${ticket.id} • Assigned to ${ticket.assignee_name}`
            : `Ticket #${ticket.id} • Created ${new Date(ticket.created_at).toLocaleDateString()}`
        }
        actions={
          <div className="flex items-center gap-3">
            {canTakeOver && (
              <Button variant="primary" onClick={handleTakeOver} disabled={assigning}>
                {assigning ? 'Taking over...' : 'Take Over'}
              </Button>
            )}
            <div className="w-48">
              <Select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="!py-2"
            >
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </Select>
            </div>
          </div>
        }
      />

      <div className="space-y-6">
        {/* Messages Thread */}
        <div className="space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.is_internal ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] rounded-2xl p-6 shadow-sm border ${
                m.is_internal 
                  ? 'bg-amber-50 border-amber-100' 
                  : 'bg-white border-slate-100'
              }`}>
                <div className="flex items-center justify-between gap-8 mb-3">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${
                    m.is_internal ? 'text-amber-600' : 'text-slate-400'
                  }`}>
                    {m.is_internal ? 'Internal Note' : 'Message'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {new Date(m.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{m.body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Reply Form */}
        <Card>
          <CardBody>
            <form onSubmit={handleReply} className="space-y-6">
              <Textarea
                label="Your Reply"
                value={reply}
                onChange={(e: any) => setReply(e.target.value)}
                rows={4}
                placeholder="Type your message here..."
                required
              />
              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={isInternal}
                    onChange={(e) => setIsInternal(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand/20"
                  />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest group-hover:text-slate-700 transition-colors">
                    Internal note (staff only)
                  </span>
                </label>
                <Button type="submit" disabled={submitting || !reply.trim()}>
                  {submitting ? 'Sending...' : 'Send Message'}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
