import * as Phaser from "phaser";
import { TYPOGRAPHY } from "../../utils/constants";

export class OptionComponent extends Phaser.GameObjects.Container {
    private titleBg: Phaser.GameObjects.Image;
    private titleText: Phaser.GameObjects.Text;
    private thumbnail: Phaser.GameObjects.Image;
    private highlightBorder: Phaser.GameObjects.Rectangle;
    private glowGraphics: Phaser.GameObjects.Graphics;
    private glowTween?: Phaser.Tweens.Tween;
    public optionId: string = '';
    public imageKey: string = '';

    // Driven by tween, read in redrawGlow()
    private glowAlpha: number = 0;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y);

        this.glowGraphics = scene.add.graphics();


        // Drag border: only visible during an active grab
        this.highlightBorder = scene.add.rectangle(0, 0, 188, 108)
            .setStrokeStyle(4, 0xcc0000)
            .setVisible(false);

        this.thumbnail = scene.add.image(0, 0, 'option_degreasing').setDisplaySize(180, 100);

        this.titleBg = scene.add.image(-95, -65, 'ui_option_tag_black').setOrigin(0, 0.5);
        this.titleText = scene.add.text(-85, -65, '', TYPOGRAPHY.optionTitle).setOrigin(0, 0.5);

        this.add([this.glowGraphics, this.highlightBorder, this.thumbnail, this.titleBg, this.titleText]);

        this.setSize(180, 100);
        this.setInteractive({ draggable: true });

        scene.add.existing(this);
    }

    public updateData(id: string, text: string, imageKey?: string) {
        this.optionId = id;
        this.titleText.setText(text);
        if (imageKey && this.scene.textures.exists(imageKey)) {
            this.thumbnail.setTexture(imageKey);
            this.imageKey = imageKey;
        }
        this.titleBg.setDisplaySize(this.titleText.width + 20, 24);
        this.setVisible(true);
    }

    // Called by GameScene after the deal-in tween completes for this card
    public playLandingGlow() {
        // Kill any previous run (safety for rapid question reloads)
        if (this.glowTween) {
            this.glowTween.stop();
            this.glowTween = undefined;
        }
        this.glowAlpha = 0;
        this.glowGraphics.clear();

        // Glow in, hold briefly at peak, glow out - one shot, no loop
        this.glowTween = this.scene.tweens.add({
            targets: this,
            glowAlpha: 1,
            duration: 420,
            ease: 'Sine.easeIn',
            yoyo: true,
            hold: 120,        // ms to sit at full glow before reversing
            onUpdate: () => this.redrawGlow(),
            onComplete: () => {
                this.glowAlpha = 0;
                this.glowGraphics.clear();
                this.glowTween = undefined;
            }
        });
    }

    private redrawGlow() {
        const g = this.glowGraphics;
        g.clear();
        if (this.glowAlpha <= 0) return;

        const w = 180;
        const h = 100;
        const cx = 0;
        const cy = 0;

        // Three concentric strokes: outermost is softest, innermost is sharpest
        // Outer halo
        // g.lineStyle(10, 0xcc0000, this.glowAlpha * 0.20);
        // g.strokeRect(cx - w / 2 - 8, cy - h / 2 - 8, w + 16, h + 16);

        // // Mid glow
        g.lineStyle(5, 0xff2222, this.glowAlpha * 0.55);
        g.strokeRect(cx - w / 2 - 3, cy - h / 2 - 3, w + 6, h + 6);

        // Tight bright edge
        g.lineStyle(2, 0xff6666, this.glowAlpha * 0.90);
        g.strokeRect(cx - w / 2, cy - h / 2, w, h);
    }

    public applyDragTint() {
        // Kill landing glow if the user grabs before it finishes
        if (this.glowTween) {
            this.glowTween.stop();
            this.glowTween = undefined;
            this.glowAlpha = 0;
            this.glowGraphics.clear();
        }
        this.thumbnail.setTint(0xdddddd);
        this.highlightBorder.setVisible(true);
        this.setAlpha(0.9);
    }

    public clearDragTint() {
        this.thumbnail.clearTint();
        this.highlightBorder.setVisible(false);
        this.setAlpha(1);
    }

    public hide() {
        if (this.glowTween) {
            this.glowTween.stop();
            this.glowTween = undefined;
        }
        this.glowAlpha = 0;
        this.glowGraphics.clear();
        this.setVisible(false);
    }
}
