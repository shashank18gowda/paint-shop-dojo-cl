// import Game from './game/Game'
// import * as Phaser from 'phaser'

// export const createGame = (parent: string | HTMLElement): Phaser.Game => {
// 	return new Game(parent).instance
// }

// createGame('app')

import Game from './game/Game';
import * as Phaser from 'phaser';
import { GameSession } from './types/interfaces';

export const createGame = (parent: string | HTMLElement, session: GameSession = {}): Phaser.Game => {
    console.log('Creating game with session:', session.languageCode, session.participantId);
    return new Game(parent, session).instance;
};

// Standalone entry (phaser/index.html): boot only when the standalone mount
// point exists. In the Next app, PhaserWrapper.tsx imports createGame and calls
// it with its own container ref — this guard prevents a duplicate game there.
if (typeof document !== 'undefined' && document.getElementById('game-container')) {
    createGame('game-container');
}
