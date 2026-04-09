import React from 'react';

interface Props {
  title: string;
  value: string | number;
}

export default function StatCard({ title, value }: Props) {
  return (
    <div style={{
      border: '1px solid #ddd',
      borderRadius: 8,
      padding: 12,
      minWidth: 160,
      background: '#fff'
    }}>
      <div style={{ color: '#666', fontSize: 12 }}>{title}</div>
      <div style={{ fontSize: 20, fontWeight: 600, marginTop: 6 }}>{value}</div>
    </div>
  );
}
