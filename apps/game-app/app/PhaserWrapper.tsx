'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createGame } from '../phaser/src/main';

export default function PhaserWrapper() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const router = useRouter();
  useEffect(() => {
    if (!containerRef.current) return;

    const searchParams = new URLSearchParams(window.location.search);
    const participantId = searchParams.get('participantId') ?? undefined;
    const languageCode = searchParams.get('languageCode') ?? undefined;
    const game = createGame(containerRef.current, { participantId, languageCode });
    gameRef.current = game;

    game.events.on('GAME_COMPLETE', (attemptId: string) => {
       router.push(`/results/${attemptId}`);
    });

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [router]);

  return (
    <div
      ref={containerRef}
      id="phaser-container"
      className="fixed inset-0 overflow-hidden"
    />
  );
}
