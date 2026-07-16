import * as Phaser from "phaser"
import { gameConfig } from "./config/gameConfig"
import type { GameSession } from "../types/interfaces"
import { normalizeLanguage } from "../utils/localization"

export default class Game {
  instance: Phaser.Game;

  constructor(parent: string | HTMLElement, session: GameSession) {
    this.instance = new Phaser.Game({
      ...gameConfig,
      parent,
      callbacks: {
        ...gameConfig.callbacks,
        preBoot: (game) => {
          gameConfig.callbacks?.preBoot?.(game);
          if (session.participantId) game.registry.set("participantId", session.participantId);
          game.registry.set("languageCode", normalizeLanguage(session.languageCode?.toLowerCase()));
        },
      },
    });
    console.log("Game.ts Loaded");
  }
}
