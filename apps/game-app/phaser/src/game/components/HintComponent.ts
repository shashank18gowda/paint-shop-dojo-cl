import * as Phaser from "phaser"
import { TYPOGRAPHY } from "../../utils/constants"
import { LanguageCode, translate } from "../../utils/localization"

export class HintComponent extends Phaser.GameObjects.Container {
    private icon: Phaser.GameObjects.Image;
    private title: Phaser.GameObjects.Text;
    private pulseTween?: Phaser.Tweens.Tween;

    // Dialog Elements
    private hintDialog: Phaser.GameObjects.Container;
    private glowBg: Phaser.GameObjects.Rectangle;
    private dialogBg: Phaser.GameObjects.Rectangle;
    private headerBg: Phaser.GameObjects.Rectangle;
    private headerTitle: Phaser.GameObjects.Text;
    private hintPopupText: Phaser.GameObjects.Text;
    private closeBtn: Phaser.GameObjects.Text;
    
    public isHintOpen: boolean = false;
    private targetScale: number;

    constructor(scene: Phaser.Scene, x: number, y: number, screenWidth: number, screenHeight: number, layoutScale: number) {
        super(scene, x, y);
        
        this.targetScale = layoutScale * 1.8;

        // --- 1. The Top-Right Icon ---
        this.icon = scene.add.image(-30, 0, 'ui_hint').setScale(0.5);
        this.icon.setInteractive({ useHandCursor: true });
        
        this.title = scene.add.text(4, -12, translate('hints', scene.registry.get('languageCode')), TYPOGRAPHY.hintTitle).setOrigin(0, 0.5);
        
        this.add([this.icon, this.title]);
        scene.add.existing(this);

        this.icon.on('pointerdown', () => {
            scene.events.emit('REQUEST_HINT');
        });

        this.setVisible(false);

        // --- 2. The Centered Dialog Container ---
        this.hintDialog = scene.add.container(screenWidth * 0.5, screenHeight * 0.5)
            .setDepth(999)
            .setVisible(false)
            .setScale(this.targetScale); 
        
        // Animated glowing border layer
        this.glowBg = scene.add.rectangle(0, 0, 500, 350, 0xcc0000)
            .setOrigin(0.5, 0.5);

        // Main white dialog background
        this.dialogBg = scene.add.rectangle(0, 0, 500, 350, 0xffffff)
            .setOrigin(0.5, 0.5)
            .setStrokeStyle(4, 0x111111);

        // Red Header Bar
        const headerHeight = 60;
        const headerY = -350 / 2 + headerHeight / 2;
        this.headerBg = scene.add.rectangle(0, headerY, 496, headerHeight, 0xcc0000)
            .setOrigin(0.5, 0.5);

        // Dynamic Header Title
        this.headerTitle = scene.add.text(0, headerY, translate('purposeOfThisProcess', scene.registry.get('languageCode')), TYPOGRAPHY.hintHeaderTitle).setOrigin(0.5, 0.5);
        
        // The text displaying the actual hints
        this.hintPopupText = scene.add.text(0, -70, '', {
            ...TYPOGRAPHY.hintPopup,
            wordWrap: { width: 450, useAdvancedWrap: true }
        }).setOrigin(0.5, 0);

        // Styled 'OK' button anchored to the bottom right corner (inside the 500x350 box)
        this.closeBtn = scene.add.text(230, 155, translate('ok', scene.registry.get('languageCode')), {
            ...TYPOGRAPHY.hintOkBtn,
        }).setOrigin(1, 1).setInteractive({ useHandCursor: true });

        // Button Hover animations
        this.closeBtn.on('pointerover', () => this.closeBtn.setScale(1.05));
        this.closeBtn.on('pointerout', () => this.closeBtn.setScale(1.0));
        this.closeBtn.on('pointerdown', () => {
            scene.sound.play('audio_tap');
            this.closeDialog();
        });

        this.hintDialog.add([this.glowBg, this.dialogBg, this.headerBg, this.headerTitle, this.hintPopupText, this.closeBtn]);

        // Continuous border pulse animation
        scene.tweens.add({
            targets: this.glowBg,
            scaleX: 1.04,
            scaleY: 1.06,
            alpha: { from: 0.8, to: 0 },
            duration: 1200,
            repeat: -1,
            ease: 'Sine.easeOut'
        });
    }

    public updateCount(_unlocked: number, _total: number) {}

    public showAndPulse() {
        this.setVisible(true);
        
        if (this.pulseTween) {
            this.pulseTween.stop();
            this.icon.setScale(0.5);
        }

        this.pulseTween = this.scene.tweens.add({
            targets: this.icon,
            scale: 0.6,
            duration: 600,
            yoyo: true,
            repeat: 2, 
            ease: 'Sine.easeInOut',
            onComplete: () => {
                this.icon.setScale(0.5); 
            }
        });
    }

    public stopPulse() {
        if (this.pulseTween) {
            this.pulseTween.stop();
            this.icon.setScale(0.5); 
        }
    }

    private playOpenAnimation() {
        this.hintDialog.setDepth(999);
        this.hintDialog.setVisible(true);
        this.scene.children.bringToTop(this.hintDialog);
        
        this.hintDialog.setScale(0.5);
        this.hintDialog.setAlpha(0);
        
        this.scene.tweens.add({
            targets: this.hintDialog,
            scale: this.targetScale,
            alpha: 1,
            duration: 400,
            ease: 'Back.easeOut'
        });
        
        this.isHintOpen = true;
    }

    public openDialog(textContent: string, titleText = translate('purposeOfThisProcess', this.scene.registry.get('languageCode'))) {
        this.updateDialog(textContent, titleText);
        this.closeBtn.setVisible(true);
        this.playOpenAnimation();
    }

    public updateDialog(textContent: string, titleText: string) {
        this.headerTitle.setText(titleText);
        this.hintPopupText.setText(textContent);
    }

    public updateLanguage(language: LanguageCode) {
        this.title.setText(translate('hints', language));
        this.closeBtn.setText(translate('ok', language));
    }

    public closeDialog() {
        this.scene.tweens.add({
            targets: this.hintDialog,
            scale: this.targetScale * 0.8,
            alpha: 0,
            duration: 200,
            ease: 'Sine.easeIn',
            onComplete: () => {
                this.hintDialog.setVisible(false);
                this.isHintOpen = false;
            }
        });
    }

    public forceReviewDialog(textContent: string, titleText: string) {
        this.updateDialog(textContent, titleText);
        this.closeBtn.setVisible(false); 
        this.playOpenAnimation();
    }

    public hideAll() {
        this.setVisible(false);
        this.stopPulse();
        this.hintDialog.setVisible(false);
        this.isHintOpen = false;
    }
}
