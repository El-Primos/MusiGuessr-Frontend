'use client';

import PlaylistAdmin from '@/components/AdminOps/PlaylistAdmin';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;

export default function PlaylistPage() {
  return (
    <div className="p-8">
      <PlaylistAdmin apiBase={API_BASE} />
    </div>
  );
}


