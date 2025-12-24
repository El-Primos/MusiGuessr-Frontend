'use client';

import UserManagement from '@/components/AdminOps/UserManagement';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;

export default function UsersPage() {
  return (
    <div className="p-8">
      <UserManagement apiBase={API_BASE} />
    </div>
  );
}
