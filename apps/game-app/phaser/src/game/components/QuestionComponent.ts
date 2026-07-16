import * as Phaser from 'phaser';
import { TYPOGRAPHY } from '../../utils/constants';

export class QuestionComponent extends Phaser.GameObjects.Container {
    private headerText: Phaser.GameObjects.Text;
    private instructionText: Phaser.GameObjects.Text;
    private headerBg: Phaser.GameObjects.Image;
    private instBg: Phaser.GameObjects.Image;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y);

        this.headerBg = scene.add.image(0, 0, 'ui_question_red');
        this.instBg = scene.add.image(0, 0, 'ui_question_white');

        this.headerText = scene.add.text(0, 0, '', { 
            ...TYPOGRAPHY.questionHeader,
            padding: { x: 20, y: 10 }, 
            wordWrap: { width: 800, useAdvancedWrap: true }
        }).setOrigin(0.5);
        
        this.instructionText = scene.add.text(0, 0, '', { 
            ...TYPOGRAPHY.questionInstruction,
            padding: { x: 20, y: 15 },
            wordWrap: { width: 900, useAdvancedWrap: true }
        }).setOrigin(0.5);

        // Ensuring the white instruction box renders underneath the red header
        this.add([this.instBg, this.headerBg, this.instructionText, this.headerText]);
        scene.add.existing(this);
    }

    public setQuestion(header: string, instruction: string) {
        this.headerText.setText(header);
        this.instructionText.setText(instruction);

        // Base padding values applied prior to external scale transformations
        const paddingX = 80;
        const paddingY = 50;
        const headerY = 0;
        const instructionY = 88;

        this.headerBg.setDisplaySize(this.headerText.width + paddingX, this.headerText.height + paddingY);
        this.instBg.setDisplaySize(this.instructionText.width + paddingX, this.instructionText.height + paddingY);

        this.headerText.setOrigin(0.5);
        this.instructionText.setOrigin(0.5);

        this.headerBg.setPosition(0, headerY);
        this.headerText.setPosition(0, headerY);
        this.instBg.setPosition(0, instructionY);
        this.instructionText.setPosition(0, instructionY);
    }

    public getBoxBounds(): { headerRect: Phaser.Geom.Rectangle, instRect: Phaser.Geom.Rectangle } {
        const s = this.scale; // container's current scale

        const hw = this.headerBg.displayWidth * s;
        const hh = this.headerBg.displayHeight * s;
        const hx = this.x + this.headerBg.x * s;
        const hy = this.y + this.headerBg.y * s;

        const iw = this.instBg.displayWidth * s;
        const ih = this.instBg.displayHeight * s;
        const ix = this.x + this.instBg.x * s;
        const iy = this.y + this.instBg.y * s;

        return {
            headerRect: new Phaser.Geom.Rectangle(hx - hw / 2, hy - hh / 2, hw, hh),
            instRect:   new Phaser.Geom.Rectangle(ix - iw / 2, iy - ih / 2, iw, ih)
        };
    }
}
