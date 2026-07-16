import * as Phaser from "phaser"
import { TIME_LIMIT_PER_QUESTION, TYPOGRAPHY } from "../../utils/constants";

export default class TimerComponent extends Phaser.GameObjects.Container {
    private timerBackground: Phaser.GameObjects.Image;
    private timerText: Phaser.GameObjects.Text;
    
    private timeLeft: number = TIME_LIMIT_PER_QUESTION;
    private timerEvent?: Phaser.Time.TimerEvent;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y);
        this.timerBackground = scene.add.image(0, 0, 'timer_background');
        this.add(this.timerBackground);

        this.timerText = scene.add.text(0, 0, this.formatTime(this.timeLeft), TYPOGRAPHY.navbar);
        this.timerText.setOrigin(0.5);
        this.add(this.timerText);

        scene.add.existing(this);
    }

    /**
     * Call this from your main GameScene to start the countdown.
     */
    public startTimer() {
        // Clear any existing timer if this is called multiple times
        if (this.timerEvent) {
            this.timerEvent.remove();
        }

        this.timeLeft = TIME_LIMIT_PER_QUESTION;
        this.updateTextDisplay();

        // Create a looping event that fires every 1000ms (1 second)
        this.timerEvent = this.scene.time.addEvent({
            delay: 1000,
            callback: this.tick,
            callbackScope: this,
            loop: true
        });
    }

    private tick() {
        this.timeLeft--;
        this.updateTextDisplay();

        // Check for completion
        if (this.timeLeft <= 0) {
            this.timeLeft = 0;
            this.updateTextDisplay();
            
            if (this.timerEvent) {
                this.timerEvent.remove();
            }
            
            this.handleTimeUp();
        }
    }

    private updateTextDisplay() {
        this.timerText.setText(this.formatTime(this.timeLeft));
    }

    /**
     * Formats raw seconds into a clean MM:SS string (e.g., 00:45)
     */
    private formatTime(seconds: number): string {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        // Pad single digits with a leading zero
        const paddedMinutes = minutes.toString().padStart(2, '0');
        const paddedSeconds = remainingSeconds.toString().padStart(2, '0');
        
        return `${paddedMinutes}:${paddedSeconds}`;
    }

    private handleTimeUp() {
        console.log("Timer hit zero!");
        
        // Emit an event so your GameScene can listen for when the time ends
        this.emit('timeout');
    }
}