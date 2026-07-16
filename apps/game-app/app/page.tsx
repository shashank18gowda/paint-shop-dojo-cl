'use client';

import dynamic from 'next/dynamic';

const PhaserWrapper = dynamic(() => import('./PhaserWrapper'), {
  ssr: false
});

export default function GamePage() {
  return (
    <main>
      <PhaserWrapper />
    </main>
  );
}