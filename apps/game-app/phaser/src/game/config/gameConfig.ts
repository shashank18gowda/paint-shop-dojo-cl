import * as Phaser from "phaser"
import PreloaderScene from "../scenes/PreloaderScene";
import GameScene from "../scenes/GameScene";
// gameConfig.ts
import { BASE_WIDTH, BASE_HEIGHT } from "../../utils/constants";
import IntroScene from "../scenes/IntroScene";
import BootScene from "../scenes/BootScene";

export const gameConfig: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: BASE_WIDTH,
    height: BASE_HEIGHT,
    backgroundColor: '#000',
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [BootScene, IntroScene, PreloaderScene, GameScene],
};