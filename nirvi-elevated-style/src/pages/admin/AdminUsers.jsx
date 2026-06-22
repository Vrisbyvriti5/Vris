import React, { useDeferredValue, useState } from 'react';
import { Eye, Trash2, UserRound } from 'lucide-react';
import { useAdminData } from '@/context/AdminDataContext';
import AdminSection from '@/components/admin/AdminSection';
import ConfirmModal from '@/components/admin/ConfirmModal';
import StatusPill from '@/components/admin/StatusPill';
import { formatDate } from '@/lib/admin-formatters';

const AdminUsers = () => {
  const { users, orders, updateUserRole, deleteUser } = useAdminData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const deferredSearch = useDeferredValue(searchTerm);
  const normalizedSearch = deferredSearch.trim().toLowerCase();

  const filteredUsers = users.filter((user) => {
    if (!normalizedSearch) {
      return true;
    }

    return [user.name, user.email, user.role].join(' ').toLowerCase().includes(normalizedSearch);
  });

  const getOrderCount = (userId) => orders.filter((order) => order.userId === userId).length;

  return (
    <>
      <div className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
        <AdminSection title="Users" description="Review account access, view activity, and adjust roles.">
          <div className="border-b border-border pb-5">
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by name, email, or role"
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-foreground"
            />
          </div>

          <div className="mt-6 hidden overflow-x-auto xl:block">
            <table className="min-w-full divide-y divide-border text-left">
              <thead>
                <tr className="text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">
                  <th className="pb-3 pr-4">User</th>
                  <th className="pb-3 pr-4">Role</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 pr-4">Orders</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="py-4 pr-4">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{user.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground font-body">{user.email}</p>
                      </div>
                    </td>
                    <td className="py-4 pr-4">
                      <select
                        value={user.role}
                        onChange={(event) => updateUserRole(user.id, event.target.value)}
                        className="rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-foreground"
                      >
                        <option value="admin">admin</option>
                        <option value="user">user</option>
                      </select>
                    </td>
                    <td className="py-4 pr-4"><StatusPill value={user.status} /></td>
                    <td className="py-4 pr-4 text-sm text-foreground">{getOrderCount(user.id)}</td>
                    <td className="py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedUser(user)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                        >
                          <Eye size={14} />
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => setUserToDelete(user)}
                          disabled={user.role === 'admin'}
                          className="inline-flex items-center gap-2 rounded-2xl border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 grid gap-4 xl:hidden">
            {filteredUsers.map((user) => (
              <div key={user.id} className="rounded-3xl border border-border bg-muted/50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{user.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground font-body">{user.email}</p>
                  </div>
                  <StatusPill value={user.status} />
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <select
                    value={user.role}
                    onChange={(event) => updateUserRole(user.id, event.target.value)}
                    className="rounded-2xl border border-border bg-background px-3 py-3 text-sm text-foreground outline-none transition-colors focus:border-foreground"
                  >
                    <option value="admin">admin</option>
                    <option value="user">user</option>
                  </select>
                  <p className="rounded-2xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground font-body">
                    {getOrderCount(user.id)} order(s)
                  </p>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedUser(user)}
                    className="flex-1 rounded-2xl border border-border px-3 py-3 text-center text-sm font-medium text-foreground transition-colors hover:bg-background"
                  >
                    View
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserToDelete(user)}
                    disabled={user.role === 'admin'}
                    className="flex-1 rounded-2xl border border-border px-3 py-3 text-center text-sm font-medium text-foreground transition-colors hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </AdminSection>

        <AdminSection title="User Detail" description="A quick preview for support and access reviews.">
          {selectedUser ? (
            <div className="space-y-5">
              <div className="flex items-center gap-4 rounded-3xl bg-muted/60 p-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-background text-foreground">
                  <UserRound size={22} />
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground">{selectedUser.name}</p>
                  <p className="text-sm text-muted-foreground font-body">{selectedUser.email}</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border bg-muted/50 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">Role</p>
                  <p className="mt-2 text-sm font-medium text-foreground">{selectedUser.role}</p>
                </div>
                <div className="rounded-2xl border border-border bg-muted/50 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">Status</p>
                  <div className="mt-2"><StatusPill value={selectedUser.status} /></div>
                </div>
                <div className="rounded-2xl border border-border bg-muted/50 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">Joined</p>
                  <p className="mt-2 text-sm font-medium text-foreground">{formatDate(selectedUser.joinedAt)}</p>
                </div>
                <div className="rounded-2xl border border-border bg-muted/50 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">Last Seen</p>
                  <p className="mt-2 text-sm font-medium text-foreground">{selectedUser.lastSeen}</p>
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-muted/50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">Order Activity</p>
                <p className="mt-2 text-sm font-medium text-foreground">{getOrderCount(selectedUser.id)} order(s) on record</p>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-border bg-muted/40 px-6 py-16 text-center">
              <UserRound size={34} className="mx-auto text-muted-foreground" />
              <p className="mt-4 text-lg font-semibold text-foreground">Select a user to inspect</p>
              <p className="mt-2 text-sm text-muted-foreground font-body">Use the View action to open quick account details here.</p>
            </div>
          )}
        </AdminSection>
      </div>

      <ConfirmModal
        open={Boolean(userToDelete)}
        title="Delete user?"
        description={userToDelete ? `This removes ${userToDelete.name} from the local admin dataset. This is UI-only and can be wired to a backend later.` : ''}
        confirmLabel="Delete User"
        onCancel={() => setUserToDelete(null)}
        onConfirm={() => {
          if (userToDelete) {
            deleteUser(userToDelete.id);
            if (selectedUser?.id === userToDelete.id) {
              setSelectedUser(null);
            }
          }
          setUserToDelete(null);
        }}
      />
    </>
  );
};

export default AdminUsers;
