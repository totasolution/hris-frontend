import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card, CardBody, CardHeader } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { useToast } from '../components/Toast';
import { Select } from '../components/Select';
import { Textarea } from '../components/Input';
import { useAuth } from '../contexts/AuthContext';
import type { Ticket, TicketMessage, Department } from '../services/api';
import * as api from '../services/api';
import { formatDate } from '../utils/formatDate';

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
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
      const [data, deptList] = await Promise.all([
        api.getTicket(ticketId),
        api.getDepartments().catch(() => [] as Department[]),
      ]);
      setTicket(data.ticket);
      setMessages(data.messages);
      setStatus(data.ticket.status);
      setDepartments(deptList);
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

  const departmentName = departments.find(d => d.id === ticket.department_id)?.name || `Department #${ticket.department_id}`;
  const statusColors = {
    open: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-yellow-100 text-yellow-700',
    resolved: 'bg-green-100 text-green-700',
    closed: 'bg-slate-100 text-slate-600',
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <PageHeader
        title={ticket.subject}
        subtitle={`Ticket #${ticket.id}`}
      />

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-red-500" />
          <p className="text-sm text-red-600 font-medium">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Ticket Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest">Ticket Details</h3>
            </CardHeader>
            <CardBody className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Status</label>
                {canRespond ? (
                  <Select
                    value={status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="w-full"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </Select>
                ) : (
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${statusColors[ticket.status as keyof typeof statusColors] || statusColors.closed}`}>
                    {ticket.status.replace('_', ' ')}
                  </span>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Department</label>
                <p className="text-sm font-medium text-slate-700">{departmentName}</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Author</label>
                <p className="text-sm font-medium text-slate-700">{ticket.author_name || '—'}</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Assignee</label>
                <p className="text-sm font-medium text-slate-700">{ticket.assignee_name || 'Unassigned'}</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Created</label>
                <p className="text-sm font-medium text-slate-700">{formatDate(ticket.created_at)}</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Last Updated</label>
                <p className="text-sm font-medium text-slate-700">{formatDate(ticket.updated_at)}</p>
              </div>

              {canTakeOver && (
                <div className="pt-4 border-t border-slate-100">
                  <Button variant="primary" onClick={handleTakeOver} disabled={assigning} className="w-full">
                    {assigning ? 'Assigning...' : 'Assign to me'}
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Right Column - Conversation */}
        <div className="lg:col-span-2 space-y-6">
          {/* Messages Thread */}
          <Card>
            <CardHeader>
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest">Conversation</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-4 min-h-[400px] max-h-[600px] overflow-y-auto pb-4">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-64 text-slate-400">
                    <p className="text-sm">No messages yet. Start the conversation below.</p>
                  </div>
                ) : (
                  messages.map((m) => {
                    // Determine if message is from requestor (ticket author) or assignee/staff
                    const isFromRequestor = m.author_id === ticket.author_id;
                    const isFromAssignee = ticket.assignee_id && m.author_id === ticket.assignee_id;
                    const isStaff = !isFromRequestor && !isFromAssignee;
                    
                    // Internal notes are always shown as staff messages
                    if (m.is_internal) {
                      return (
                        <div key={m.id} className="flex justify-center">
                          <div className="max-w-[85%] rounded-xl p-3 bg-amber-50 border border-amber-200">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                                Internal Note
                              </span>
                              <span className="text-[10px] text-amber-600">
                                {m.author_name || 'Staff'}
                              </span>
                              <span className="text-[10px] text-amber-500">
                                • {new Date(m.created_at).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-wrap">{m.body}</p>
                          </div>
                        </div>
                      );
                    }
                    
                    // Regular messages: requestor on left, assignee/staff on right
                    return (
                      <div
                        key={m.id}
                        className={`flex ${isFromRequestor ? 'justify-start' : 'justify-end'}`}
                      >
                        <div className={`max-w-[70%] rounded-2xl p-4 shadow-sm ${
                          isFromRequestor
                            ? 'bg-blue-50 border border-blue-100 rounded-tl-sm'
                            : 'bg-slate-50 border border-slate-200 rounded-tr-sm'
                        }`}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs font-bold ${
                              isFromRequestor ? 'text-blue-700' : 'text-slate-600'
                            }`}>
                              {m.author_name || (isFromRequestor ? 'Requestor' : 'Staff')}
                            </span>
                            <span className={`text-[10px] ${
                              isFromRequestor ? 'text-blue-500' : 'text-slate-400'
                            }`}>
                              • {new Date(m.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className={`text-sm leading-relaxed whitespace-pre-wrap ${
                            isFromRequestor ? 'text-blue-900' : 'text-slate-700'
                          }`}>{m.body}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardBody>
          </Card>

          {/* Reply Form */}
          {canRespond && (
            <Card>
              <CardHeader>
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest">Reply</h3>
              </CardHeader>
              <CardBody>
                <form onSubmit={handleReply} className="space-y-4">
                  <Textarea
                    label="Your Reply"
                    value={reply}
                    onChange={(e: any) => setReply(e.target.value)}
                    rows={4}
                    placeholder="Type your message here..."
                    required
                  />
                  <div className="flex items-center justify-between pt-2">                    
                    <Button type="submit" disabled={submitting || !reply.trim()}>
                      {submitting ? 'Sending...' : 'Send Message'}
                    </Button>
                  </div>
                </form>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
