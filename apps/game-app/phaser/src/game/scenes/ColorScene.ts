import * as Phaser from 'phaser';


export default class ColorScene extends Phaser.Scene {
    private transparentImage!: Phaser.GameObjects.Image;


    constructor() {
        super({ key: 'ColorScene' });
        console.log("ColorScene.ts Loaded");
    }


    create() {
        console.log("ColorScene.create: starting ColorScene");
        
        const { width, height } = this.scale;
        const cx = width / 2;
        const cy = height / 2;

        this.add.image(cx, cy, 'color')
        .setDisplaySize(500, 500);

    this.transparentImage = this.add.image(cx, cy, 'transparent')
        .setDisplaySize(500, 500)
        .setInteractive({ useHandCursor: true, draggable: true })
        .on('drag', (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
            this.transparentImage.x = dragX;
            this.transparentImage.y = dragY;
        });
    }
}
