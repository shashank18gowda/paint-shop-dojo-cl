import * as Phaser from 'phaser';
import { BASE_HEIGHT, BASE_WIDTH, INTRO_FONTS, VEHICLES } from '../../utils/constants';
import { DEFAULT_LANGUAGE, normalizeLanguage, translate } from '../../utils/localization';
import { mapQuizDataFromApi, startGameSession } from '../../services/apiServices';

export default class IntroScene extends Phaser.Scene {
    private loadingText!: Phaser.GameObjects.Text;
    private isStarting: boolean = false;

    constructor() {
        super({ key: 'IntroScene' });
    }

    create() {
        const { width, height } = this.scale;
        const layoutScale = Math.min(width / BASE_WIDTH, height / BASE_HEIGHT);
        const language = normalizeLanguage(this.registry.get('languageCode') ?? DEFAULT_LANGUAGE);

        // 1. Launch PreloaderScene in parallel to silently load heavy game assets
        // this.scene.launch('PreloaderScene');
        // this.scene.get('PreloaderScene').events.once('ASSETS_READY', () => {
        //     this.assetsReady = true;
        //     this.tryTransition();
        // });

        this.sound.play('game_intro', { volume: 0.5 });

        // 2. Build Intro UI
        this.add.rectangle(0, 0, width, height, 0x0c0d11).setOrigin(0);
        
        this.add.text(width * 0.5, height * 0.22, translate('introTitle', language), INTRO_FONTS.headingRed(layoutScale)).setOrigin(0.5, 0.5);
        // this.add.text(width * 0.5, height * 0.22, '', INTRO_FONTS.headingWhite(layoutScale)).setOrigin(0.5, 0.5);

        this.add.text(width * 0.5, height * 0.30, translate('introSubtitle', language), INTRO_FONTS.subheading(layoutScale)).setOrigin(0.5, 0.5);

        // 3. Setup Animated Loading Text
        this.loadingText = this.add.text(width * 0.5, height * 0.88, translate('loadingAssets', language), INTRO_FONTS.loading(layoutScale)).setOrigin(0.5, 0.5).setVisible(false);

        // Create a pulsing animation for the loading text to act as a spinner
        this.tweens.add({
            targets: this.loadingText,
            alpha: 0.3,
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        const cardY = height * 0.60;
        VEHICLES.forEach((vehicle, index) => {
            const x = width * (index === 0 ? 0.35 : 0.65);
            this.createCarCard(x, cardY, layoutScale, vehicle.imageKey, translate(vehicle.translationKey, language), vehicle.id);
        });
    }

    private createCarCard(x: number, y: number, layoutScale: number, imageKey: string, title: string, vehicleId: string) {
        const card = this.add.container(x, y);
        card.setScale(layoutScale);
        
        const bg = this.add.rectangle(0, 0, 500, 400, 0xffffff).setInteractive({ useHandCursor: true });
        bg.setStrokeStyle(4, 0xffffff);

        const carImg = this.add.image(0, -40, imageKey).setDisplaySize(420, 200);
        const line = this.add.rectangle(0, 100, 420, 2, 0xe0e0e0);

        const text = this.add.text(0, 150, title, INTRO_FONTS.cardTitle(layoutScale)).setOrigin(0.5, 0.5);

        card.add([bg, carImg, line, text]);

        bg.on('pointerover', () => {
            this.tweens.add({ targets: card, scale: layoutScale * 1.04, duration: 200, ease: 'Sine.easeOut' });
            bg.setStrokeStyle(4, 0xe60000);
        });

        bg.on('pointerout', () => {
            this.tweens.add({ targets: card, scale: layoutScale, duration: 200, ease: 'Sine.easeOut' });
            bg.setStrokeStyle(4, 0xffffff);
        });

        bg.on('pointerdown', () => {
            if (this.isStarting) return;

            this.isStarting = true;
            bg.fillColor = 0xf0f0f0;
            this.time.delayedCall(100, () => { bg.fillColor = 0xffffff; });

            this.loadingText.setVisible(true);

            // this.scene.launch('PreloaderScene', { vehicle: vehicleId });
            // //Call the backend api to start the game session and fetch the quiz data
            
            // this.scene.get('PreloaderScene').events.once('ASSETS_READY', () => {
            //     this.assetsReady = true;
            //     this.tryTransition();
            // });
            this.startGame(vehicleId);
        });

        return card;
    }

    // Inside your scene class...
    private async startGame(vehicleId: string) {
        // Listen before launch so a very fast preload cannot emit before the handler exists.
        const preloaderScene = this.scene.get('PreloaderScene');
        const assetsPromise = new Promise((resolve) => {
            preloaderScene.events.once('ASSETS_READY', () => {
                console.log('[IntroScene] Assets loaded');
                resolve(true);
            });
        });

        this.scene.launch('PreloaderScene', { vehicle: vehicleId });
        console.log(`[IntroScene] Launched PreloaderScene for vehicle: ${vehicleId}`);

        // 3. Create the API Promise
        const apiPayload = {
            carModelCode: vehicleId.toUpperCase(),
            languageCode: normalizeLanguage(this.registry.get('languageCode'))
        };
        
        // We don't 'await' it yet, we just start the request
        const apiPromise = startGameSession(apiPayload); 

        try {
            // 4. Wait for BOTH the API and the Assets to finish
            // Promise.all runs them simultaneously and waits for the slowest one
            const [ _, apiResponse ] = await Promise.all([assetsPromise, apiPromise]);
            console.log('[IntroScene] API response received:', apiResponse);

            if (!apiResponse.success || !apiResponse.data.questions?.length) {
                throw new Error('Game session response did not contain quiz questions');
            }

            const quizData = mapQuizDataFromApi(apiResponse.data);
            console.log(`[IntroScene] Processed ${quizData.length} backend questions`);

            console.log('Both Assets and API Data are ready!');

            // 5. Stop the preloader and transition to GameScene
            // Pass the raw apiResponse into the scene's data payload
            this.scene.stop('PreloaderScene'); 
            this.scene.start('GameScene', {
                variant: vehicleId,
                sessionData: apiResponse.data,
                quizData
            });

        } catch (error) {
            console.error('Failed to load game session:', error);
            this.scene.stop('PreloaderScene');
            this.isStarting = false;
            this.loadingText.setText(translate('loadFailed', this.registry.get('languageCode')));
        }
    }

}
