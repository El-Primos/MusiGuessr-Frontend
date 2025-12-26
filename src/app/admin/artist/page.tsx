'use client';

import ArtistPanel from '@/components/AdminOps/ArtistPanel';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;

export default function ArtistPanelPage() {
  return (
    <div className="p-8">
      <ArtistPanel apiBase={API_BASE} />
    </div>
  );
}