import * as Phaser from "phaser";
import { TYPOGRAPHY } from "../../utils/constants";
import { translate } from "../../utils/localization";

export class VideoComponent extends Phaser.GameObjects.Container {
    private videoPlayer?: Phaser.GameObjects.Video;
    private videoMask?: Phaser.GameObjects.Graphics;
    private backdrop: Phaser.GameObjects.Rectangle;
    private borderBox: Phaser.GameObjects.Graphics;
    private titleBg: Phaser.GameObjects.Rectangle;
    private titleText: Phaser.GameObjects.Text;
    private screenW: number;
    private screenH: number;

    constructor(scene: Phaser.Scene, x: number, y: number, screenWidth: number, screenHeight: number) {
        super(scene, x, y);
        
        this.screenW = screenWidth;
        this.screenH = screenHeight;
        
        this.setDepth(9999); 
        
        this.backdrop = scene.add.rectangle(0, 0, screenWidth, screenHeight, 0x000000, 0.85);
        this.backdrop.setInteractive(); 
        this.backdrop.setVisible(false);

        this.borderBox = scene.make.graphics({ x: 0, y: 0 });
        this.titleBg = scene.add.rectangle(0, 0, 10, 10, 0x27ae60).setOrigin(0.5, 1).setVisible(false);
        this.titleText = scene.add.text(0, 0, '', {
            ...TYPOGRAPHY.videoSuccessTitle,
            fontSize: '30px'
        }).setOrigin(0.5, 1).setVisible(false);

        // Pre-add all UI elements to enforce a strict layering hierarchy 
        // Order: Backdrop (0), Title Background (1), Border (2), Text (3)
        this.add([this.backdrop, this.titleBg, this.borderBox, this.titleText]);
        scene.add.existing(this);
    }

    public playVideo(videoKey: string, optionName: string, pointsEarned: number, onComplete: () => void) {
        if (this.videoPlayer) {
            this.videoPlayer.destroy();
        }
        if (this.videoMask) {
            this.videoMask.destroy();
        }

        this.backdrop.setVisible(true);

        this.videoPlayer = this.scene.add.video(0, 0, videoKey);
        
        // Insert video immediately above the backdrop (Index 1) so borders and banners render on top
        this.addAt(this.videoPlayer, 1);
        
        this.videoPlayer.play();

        this.videoPlayer.once('play', () => {
            if (this.videoPlayer && this.videoPlayer.video) {
                const videoWidth = this.videoPlayer.video.videoWidth || 1280;
                const videoHeight = this.videoPlayer.video.videoHeight || 720;
                
                const targetWidth = this.screenW * 0.75;
                const targetHeight = this.screenH * 0.75;
                
                const scale = Math.min(targetWidth / videoWidth, targetHeight / videoHeight);
                this.videoPlayer.setScale(scale);

                const displayWidth = videoWidth * scale;
                const displayHeight = videoHeight * scale;

                // 1. Physically round the video feed using a geometry mask
                this.videoMask = this.scene.make.graphics();
                this.videoMask.setPosition(this.x, this.y); 
                this.videoMask.fillStyle(0xffffff);
                this.videoMask.fillRoundedRect(-displayWidth / 2, -displayHeight / 2, displayWidth, displayHeight, 16);
                this.videoPlayer.setMask(this.videoMask.createGeometryMask());

                // 2. Frame the masked video with a thick, cohesive border
                this.borderBox.clear();
                this.borderBox.lineStyle(10, 0x27ae60);
                this.borderBox.strokeRoundedRect(-displayWidth / 2, -displayHeight / 2, displayWidth, displayHeight, 16);

                // 3. Configure the dynamic success banner text
                const successMessage = pointsEarned > 0
                    ? translate('correctAnswerWithPoints', this.scene.registry.get('languageCode'), { answer: optionName, points: pointsEarned })
                    : translate('correctAnswer', this.scene.registry.get('languageCode'), { answer: optionName });
                this.titleText.setText(successMessage);
                const topEdge = -(displayHeight / 2);
                
                // Position text comfortably above the video edge
                this.titleText.setY(topEdge - 15); 
                this.titleText.setVisible(true);

                // 4. Align the banner background so its bottom edge is hidden UNDER the top border stroke
                this.titleBg.setSize(this.titleText.width + 80, this.titleText.height + 25);
                this.titleBg.setY(topEdge + 5); 
                this.titleBg.setVisible(true);
            }
        });

        this.videoPlayer.once('complete', () => {
            this.videoPlayer?.destroy();
            this.videoPlayer = undefined;
            if (this.videoMask) {
                this.videoMask.destroy();
                this.videoMask = undefined;
            }
            this.backdrop.setVisible(false);
            this.borderBox.clear();
            this.titleBg.setVisible(false);
            this.titleText.setVisible(false);
            onComplete();
        });
    }
}
