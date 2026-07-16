import * as Phaser from "phaser";

export class CarComponent extends Phaser.GameObjects.Image {
    constructor(scene: Phaser.Scene, x: number, y: number, textureKey: string) {
        super(scene, x, y, textureKey);
        scene.add.existing(this);
    }

    public updateState(newTextureKey: string) {
        this.setTexture(newTextureKey);
    }

    // Triggers a rapid horizontal shake animation
    public vibrate() {
        const startX = this.x;
        
        this.scene.tweens.add({
            targets: this,
            x: startX + 15,     // Shift right by 15 pixels
            duration: 40,       // Very fast transition
            yoyo: true,         // Instantly reverse the motion back to the start
            repeat: 4,          // Loop the shake 4 times
            onComplete: () => {
                // Failsafe to guarantee the asset perfectly realigns when the animation finishes
                this.x = startX; 
            }
        });
    }
}