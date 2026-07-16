import * as Phaser from 'phaser';
import { BASE_HEIGHT, BASE_WIDTH, SESSION_DEFAULTS, TIME_LIMIT_PER_QUESTION, TIMER_TICK_INTERVAL, TIMER_WARNING_THRESHOLD, TYPOGRAPHY } from '../../utils/constants';
import { LanguageCode, normalizeLanguage, translate } from '../../utils/localization';

export class NavbarComponent extends Phaser.GameObjects.Container {
    private idText: Phaser.GameObjects.Text;
    private stepText: Phaser.GameObjects.Text;
    private timerText: Phaser.GameObjects.Text;
    private scoreText: Phaser.GameObjects.Text;
    private timerIcon: Phaser.GameObjects.Image;

    // Timer state variables
    private timeLeft: number = TIME_LIMIT_PER_QUESTION;
    private timerEvent?: Phaser.Time.TimerEvent;
    private stepTween?: Phaser.Tweens.Tween;
    private alertTween?: Phaser.Tweens.Tween;
    
    // Store original scale to reset the icon after the pulse animation
    private baseIconScale: number;
    private language: LanguageCode;
    private currentStep = 1;
    private totalSteps = 2;
    private employeeId: string = SESSION_DEFAULTS.employeeId;
    private score: number = SESSION_DEFAULTS.maxScore;

    constructor(scene: Phaser.Scene, x: number, y: number, screenWidth: number, screenHeight: number) {
        super(scene, x, y);

        this.language = normalizeLanguage(scene.registry.get('languageCode'));
        const layoutScale = Math.min(screenWidth / BASE_WIDTH, screenHeight / BASE_HEIGHT);
        this.baseIconScale = layoutScale * 0.04;
        
        const navHeight = screenHeight * 0.065;
        const centerY = navHeight / 2;

        const bg = scene.add.image(screenWidth / 2, centerY, 'ui_navbar_bg').setDisplaySize(screenWidth, navHeight);
        
        // Pushing the ID and Score backgrounds further to the right
        const idX = screenWidth * 0.62;
        const scoreX = screenWidth * 0.78;
        
        const hudBackgroundKey = 'ui_score_bg';
        const hudBackgroundScale = layoutScale * 0.25;
        const idBg = scene.add.image(idX, centerY, hudBackgroundKey).setScale(hudBackgroundScale);
        const scoreBg = scene.add.image(scoreX, centerY, hudBackgroundKey).setScale(hudBackgroundScale);

        const textStyle = TYPOGRAPHY.navbar;

        // Process step text placed on the left white area, colored black, shifted down slightly relative to screen width
        const stepX = screenWidth * 0.22;
        const stepY = centerY + (screenWidth * 0.005);
        this.stepText = scene.add.text(stepX, stepY, translate('processProgress', this.language, { current: this.currentStep, total: this.totalSteps }), {
            ...textStyle,
            color: '#000000'
        }).setOrigin(0.5, 0.5);

        this.idText = scene.add.text(idX, centerY, translate('employeeId', this.language, { id: this.employeeId }), textStyle).setOrigin(0.5);
        this.scoreText = scene.add.text(scoreX, centerY, translate('scoreWithPoints', this.language, { score: this.score }), textStyle).setOrigin(0.5);

        // Timer components pushed to the far right edge
        const timerTextX = screenWidth * 0.96; 
        this.timerText = scene.add.text(timerTextX, centerY, this.formatTime(this.timeLeft), textStyle).setOrigin(1, 0.5);
        
        const timerIconX = screenWidth * 0.91;
        this.timerIcon = scene.add.image(timerIconX, centerY, 'ui_timer_icon').setScale(this.baseIconScale); 

        this.add([bg, idBg, scoreBg, this.idText, this.timerIcon, this.timerText, this.scoreText, this.stepText]);
        scene.add.existing(this);

        this.startTimer();
    }

    public startTimer() {
        this.stopTimer();
        
        this.timeLeft = TIME_LIMIT_PER_QUESTION;
        
        // Reset colors and animation states
        this.timerIcon.setTexture('ui_timer_icon');
        this.timerText.setColor('#ffffff');
        
        if (this.alertTween) {
            this.alertTween.stop();
            this.alertTween = undefined;
        }
        
        this.timerIcon.setScale(this.baseIconScale);
        this.timerText.setScale(1);
        
        this.updateTextDisplay();

        this.timerEvent = this.scene.time.addEvent({
            delay: TIMER_TICK_INTERVAL,
            callback: this.tick,
            callbackScope: this,
            loop: true
        });
    }

    public stopTimer() {
        if (this.timerEvent) {
            this.timerEvent.remove();
            this.timerEvent = undefined;
        }

        if (this.scene.cache.audio.exists('ten_seconds_timer')) {
            this.scene.sound.stopByKey('ten_seconds_timer');
        }
        
        if (this.alertTween) {
            this.alertTween.stop();
            this.timerIcon.setScale(this.baseIconScale);
            this.timerText.setScale(1);
        }
    }

    public resetTimer() {
        this.startTimer();
    }

    public setStepCount(currentStep: number, totalSteps: number) {
        this.currentStep = currentStep;
        this.totalSteps = totalSteps;
        this.stepText.setText(translate('processProgress', this.language, { current: currentStep, total: totalSteps }));

        if (this.stepTween) {
            this.stepTween.stop();
        }

        this.stepText.setScale(0.96);
        this.stepText.setAlpha(0.75);

        this.stepTween = this.scene.tweens.add({
            targets: this.stepText,
            scale: 1,
            alpha: 1,
            duration: 260,
            ease: 'Sine.easeOut'
        });
    }

    private tick() {
        this.timeLeft--;

        // Trigger visual warning and pulsing animation exactly at 10 seconds
        if (this.timeLeft === TIMER_WARNING_THRESHOLD) {
            this.timerIcon.setTexture('ui_timer_icon_red');
            this.timerText.setColor('#ff4444');
            
            // this.alertTween = this.scene.tweens.add({
            //     targets: [this.timerIcon],
            //     scale: 0.05,
            //     duration: 500,
            //     yoyo: true,
            //     repeat: 10,
            //     ease: 'Sine.easeInOut'
            // });

            this.alertTween = this.scene.tweens.add({
                targets: [this.timerText],
                scale: 1.15,
                duration: 500,
                yoyo: true,
                repeat: 10,
                ease: 'Sine.easeInOut'
            });
        }

        if (this.timeLeft <= TIMER_WARNING_THRESHOLD && this.timeLeft > 0) {
            if (this.scene.cache.audio.exists('ten_seconds_timer')) {
                this.scene.sound.play('ten_seconds_timer');
            } else {
                console.warn("ten_seconds_timer is missing from PreloaderScene");
            }
        }

        this.updateTextDisplay();

        if (this.timeLeft <= 0) {
            this.timeLeft = 0;
            this.updateTextDisplay();
            
            this.stopTimer();
            
            console.log("Timer hit zero!");
            this.scene.events.emit('TIMEOUT');
        }
    }

    private formatTime(seconds: number): string {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        const paddedMinutes = minutes.toString().padStart(2, '0');
        const paddedSeconds = remainingSeconds.toString().padStart(2, '0');
        
        return `${paddedMinutes}:${paddedSeconds}`;
    }

    private updateTextDisplay() {
        this.timerText.setText(this.formatTime(this.timeLeft));
    }
    
    public updateScore(score: number) {
        this.score = score;
        this.scoreText.setText(translate('score', this.language, { score }));
    }

    public clearStepAnimation() {
        if (this.stepTween) {
            this.stepTween.stop();
            this.stepTween = undefined;
        }

        this.stepText.setScale(1);
        this.stepText.setAlpha(1);
    }
    
    public setId(employeeId: string) {
        this.employeeId = employeeId;
        this.idText.setText(translate('employeeId', this.language, { id: employeeId }));
    }

    public updateLanguage(language: LanguageCode) {
        this.language = language;
        this.stepText.setText(translate('processProgress', language, { current: this.currentStep, total: this.totalSteps }));
        this.idText.setText(translate('employeeId', language, { id: this.employeeId }));
        this.scoreText.setText(translate('score', language, { score: this.score }));
    }
}
