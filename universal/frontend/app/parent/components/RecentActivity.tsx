import React from 'react';
import { Insight } from '@/lib/types/analytics';

interface Props {
  items: Insight[];
}

export default function RecentActivity({ items }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map(it => (
        <div key={it.id} style={{ border: '1px solid #eee', padding: 10, borderRadius: 8, background: '#fff' }}>
          <div style={{ fontSize: 12, color: '#888' }}>{new Date(it.date).toLocaleString()}</div>
          <div style={{ fontWeight: 600, marginTop: 6 }}>{it.type.toUpperCase()}</div>
          <div style={{ marginTop: 6 }}>{it.message}</div>
          {it.relatedTopic && <div style={{ marginTop: 6, color: '#666', fontSize: 12 }}>Topic: {it.relatedTopic}</div>}
        </div>
      ))}
    </div>
  );
}
