import * as Phaser from 'phaser';

// Loads only what IntroScene needs, then hands off immediately.
// Kept minimal so there's zero perceptible delay before the intro appears.
export default class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // Only load intro assets here; everything else is PreloaderScene's job
        this.load.image('intro_hyryder', 'assets/images/car/intro_hyryder.png');
        this.load.image('intro_hycross', 'assets/images/car/intro_hycross.png');

        this.load.audio('game_intro', 'assets/audios/game_intro.mp3');
    }

    create() {
        this.scene.start('IntroScene');
    }
}