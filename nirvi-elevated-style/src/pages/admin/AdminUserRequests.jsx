import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, Mail, RefreshCw } from 'lucide-react';
import AdminSection from '@/components/admin/AdminSection';
import { contactAPI, newsletterAPI } from '@/lib/api';
import { formatDate } from '@/lib/admin-formatters';
import { useToast } from '@/components/ui/use-toast';

const AdminUserRequests = () => {
  const { toast } = useToast();

  const [messages, setMessages] = useState([]);
  const [subscribers, setSubscribers] = useState([]);

  const [messagesLoading, setMessagesLoading] = useState(false);
  const [subscribersLoading, setSubscribersLoading] = useState(false);

  const [messagesError, setMessagesError] = useState('');
  const [subscribersError, setSubscribersError] = useState('');

  const [messageSearch, setMessageSearch] = useState('');
  const [subscriberSearch, setSubscriberSearch] = useState('');

  const loadContactMessages = async ({ showToast = false } = {}) => {
    setMessagesLoading(true);
    setMessagesError('');

    try {
      const response = await contactAPI.getMessages();
      setMessages(response.data || []);
      if (showToast) {
        toast({ title: 'Contact messages refreshed' });
      }
    } catch (error) {
      const message = error.data?.message || error.message || 'Failed to load contact messages.';
      setMessagesError(message);
      if (showToast) {
        toast({
          variant: 'destructive',
          title: 'Could not refresh contact messages',
          description: message,
        });
      }
    } finally {
      setMessagesLoading(false);
    }
  };

  const loadNewsletterSubscribers = async ({ showToast = false } = {}) => {
    setSubscribersLoading(true);
    setSubscribersError('');

    try {
      const response = await newsletterAPI.getSubscribers();
      setSubscribers(response.data || []);
      if (showToast) {
        toast({ title: 'Newsletter subscribers refreshed' });
      }
    } catch (error) {
      const message = error.data?.message || error.message || 'Failed to load newsletter subscribers.';
      setSubscribersError(message);
      if (showToast) {
        toast({
          variant: 'destructive',
          title: 'Could not refresh newsletter subscribers',
          description: message,
        });
      }
    } finally {
      setSubscribersLoading(false);
    }
  };

  useEffect(() => {
    loadContactMessages();
    loadNewsletterSubscribers();
  }, []);

  const filteredMessages = useMemo(() => {
    const search = String(messageSearch || '').trim().toLowerCase();

    return [...messages]
      .filter((entry) => {
        if (!search) {
          return true;
        }

        const searchable = [entry.name, entry.email, entry.subject, entry.message]
          .join(' ')
          .toLowerCase();

        return searchable.includes(search);
      })
      .sort((first, second) => new Date(second.created_at) - new Date(first.created_at));
  }, [messages, messageSearch]);

  const filteredSubscribers = useMemo(() => {
    const search = String(subscriberSearch || '').trim().toLowerCase();

    return [...subscribers]
      .filter((entry) => {
        if (!search) {
          return true;
        }

        return String(entry.email || '').toLowerCase().includes(search);
      })
      .sort((first, second) => new Date(second.created_at) - new Date(first.created_at));
  }, [subscribers, subscriberSearch]);

  return (
    <div className="space-y-6">
      <AdminSection
        title="User Requests / Contact Messages"
        description="Messages submitted through Get in Touch are listed here."
        actions={(
          <button
            type="button"
            onClick={() => loadContactMessages({ showToast: true })}
            disabled={messagesLoading}
            className="inline-flex items-center gap-2 rounded-2xl border border-border px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-foreground transition-colors hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={14} className={messagesLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
        )}
      >
        {messagesError ? (
          <div className="mb-5 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive font-body">
            {messagesError}
          </div>
        ) : null}

        <div className="border-b border-border pb-5">
          <input
            type="search"
            value={messageSearch}
            onChange={(event) => setMessageSearch(event.target.value)}
            placeholder="Search by name, email, subject, or message"
            className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-foreground"
          />
        </div>

        {messagesLoading && messages.length === 0 ? (
          <div className="mt-6 space-y-4">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="h-20 animate-pulse rounded-2xl bg-muted/60" />
            ))}
          </div>
        ) : null}

        {!messagesLoading && filteredMessages.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-border bg-muted/40 px-5 py-10 text-center">
            <p className="text-sm text-muted-foreground font-body">No contact messages found.</p>
          </div>
        ) : null}

        {!messagesLoading && filteredMessages.length > 0 ? (
          <div className="mt-6 hidden overflow-x-auto xl:block">
            <table className="min-w-full divide-y divide-border text-left">
              <thead>
                <tr className="text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">
                  <th className="pb-3 pr-4">Name</th>
                  <th className="pb-3 pr-4">Email</th>
                  <th className="pb-3 pr-4">Subject</th>
                  <th className="pb-3 pr-4">Message</th>
                  <th className="pb-3">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredMessages.map((entry) => (
                  <tr key={entry.id}>
                    <td className="py-4 pr-4 text-sm font-semibold text-foreground">{entry.name}</td>
                    <td className="py-4 pr-4 text-sm text-muted-foreground font-body">
                      <a href={`mailto:${entry.email}`} className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
                        <Mail size={12} />
                        {entry.email}
                      </a>
                    </td>
                    <td className="py-4 pr-4 text-sm text-foreground">{entry.subject}</td>
                    <td className="py-4 pr-4 text-sm text-muted-foreground font-body max-w-md">{entry.message}</td>
                    <td className="py-4 text-sm text-muted-foreground font-body">{formatDate(entry.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {!messagesLoading && filteredMessages.length > 0 ? (
          <div className="mt-6 grid gap-4 xl:hidden">
            {filteredMessages.map((entry) => (
              <div key={entry.id} className="rounded-3xl border border-border bg-muted/50 p-4">
                <p className="text-sm font-semibold text-foreground">{entry.name}</p>
                <a href={`mailto:${entry.email}`} className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors font-body">
                  <Mail size={12} />
                  {entry.email}
                </a>
                <p className="mt-3 text-sm font-medium text-foreground">{entry.subject}</p>
                <p className="mt-2 text-sm text-muted-foreground font-body">{entry.message}</p>
                <p className="mt-3 text-xs text-muted-foreground font-body">Submitted {formatDate(entry.created_at)}</p>
              </div>
            ))}
          </div>
        ) : null}
      </AdminSection>

      <AdminSection
        title="Newsletter Subscribers"
        description="Emails subscribed through Stay Updated are listed here."
        actions={(
          <button
            type="button"
            onClick={() => loadNewsletterSubscribers({ showToast: true })}
            disabled={subscribersLoading}
            className="inline-flex items-center gap-2 rounded-2xl border border-border px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-foreground transition-colors hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={14} className={subscribersLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
        )}
      >
        {subscribersError ? (
          <div className="mb-5 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive font-body">
            {subscribersError}
          </div>
        ) : null}

        <div className="border-b border-border pb-5">
          <input
            type="search"
            value={subscriberSearch}
            onChange={(event) => setSubscriberSearch(event.target.value)}
            placeholder="Search subscribed email"
            className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-foreground"
          />
        </div>

        {subscribersLoading && subscribers.length === 0 ? (
          <div className="mt-6 space-y-4">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="h-20 animate-pulse rounded-2xl bg-muted/60" />
            ))}
          </div>
        ) : null}

        {!subscribersLoading && filteredSubscribers.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-border bg-muted/40 px-5 py-10 text-center">
            <p className="text-sm text-muted-foreground font-body">No newsletter subscribers found.</p>
          </div>
        ) : null}

        {!subscribersLoading && filteredSubscribers.length > 0 ? (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-left">
              <thead>
                <tr className="text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">
                  <th className="pb-3 pr-4">Email</th>
                  <th className="pb-3">Subscribed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredSubscribers.map((entry) => (
                  <tr key={entry.id}>
                    <td className="py-4 pr-4 text-sm text-foreground">{entry.email}</td>
                    <td className="py-4 text-sm text-muted-foreground font-body">{formatDate(entry.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </AdminSection>
    </div>
  );
};

export default AdminUserRequests;
