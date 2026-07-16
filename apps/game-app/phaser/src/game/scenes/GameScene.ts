import * as Phaser from 'phaser';
import { Scene } from 'phaser';
import { NavbarComponent } from '../components/NavbarComponent';
import { OptionComponent } from '../components/OptionComponent';
import { HintComponent } from '../components/HintComponent';
import { QuestionComponent } from '../components/QuestionComponent';
import { CarComponent } from '../components/CarComponent';
import { VideoComponent } from '../components/VideoComponent';
import { BASE_HEIGHT, BASE_WIDTH, PROCESS_PURPOSE_TIME_LIMIT, SCORE_RULES, SESSION_DEFAULTS, TYPOGRAPHY } from '../../utils/constants';
import { LanguageCode, normalizeLanguage, translate, TranslationKey } from '../../utils/localization';
import { GameSceneInitData, QuestionKind, QuizStep, RuntimeQuizQuestion, SubmitBatchPayload, SubmitQuizPayload } from '../../types/interfaces';
import { submitGameRun } from '../../services/apiServices';

export default class GameScene extends Scene {
    private navbar!: NavbarComponent;
    private questionBox!: QuestionComponent;
    private hintCounter!: HintComponent;
    private carStage!: CarComponent;
    private videoStage!: VideoComponent;
    private options: OptionComponent[] = [];
    private colorChoice: string = '';
    private colorChoiceId: string = '';
    private activeDragProxy: Phaser.GameObjects.Image | null = null;

    private awaitingColorSelection: boolean = false;
    private currentQuestionIndex: number = 0;
    private isTransitioning: boolean = false; 
    private totalScore: number = 0;
    
    private wrongAttempts: number = 0;
    private hintsViewed: boolean = false;
    private hintsUsed: number = 0;

    // Session Tracking State
    private sessionStartTime: number = 0;
    private stepStartTime: number = 0;
    private payload!: SubmitQuizPayload;
    private currentStep!: QuizStep;
    private quizData: RuntimeQuizQuestion[] = [];


    constructor() {
        super({ key: 'GameScene' });
    }

    init(data: GameSceneInitData) {
        if (!data.quizData?.length) {
            throw new Error('GameScene cannot start without processed quiz data');
        }

        const sessionData = data.sessionData;
        this.quizData = data.quizData;
        console.log(`[GameScene] Initialized with ${this.quizData.length} backend questions`, {
            runId: sessionData.runId,
            variant: data.variant
        });

        // Initialize the tracking payload with fallback defaults if external data is missing
        if (!this.registry.has('languageCode')) {
            this.registry.set('languageCode', normalizeLanguage(sessionData.languageCode));
        }

        this.sessionStartTime = Date.now();
        this.payload = {
            runId: sessionData.runId,
            participantId: data.participantId || this.registry.get('participantId') || SESSION_DEFAULTS.participantId,
            flowId: data.flowId || SESSION_DEFAULTS.flowId,
            variant: data.variant || SESSION_DEFAULTS.variant,
            languageCode: this.registry.get('languageCode'),
            startedAt: new Date(this.sessionStartTime).toISOString(),
            completedAt: '',
            timeTaken: 0,
            score: 0,
            maxScore: sessionData.maxScore || SESSION_DEFAULTS.maxScore,
            steps: []
        };
    }

    create() {
        this.sound.stopByKey('game_intro');

        const { width, height } = this.scale;
        
        const baseWidth = (this.sys.game.config.width as number) || BASE_WIDTH;
        const baseHeight = (this.sys.game.config.height as number) || BASE_HEIGHT;
        const layoutScale = Math.min(width / baseWidth, height / baseHeight);

        this.add.image(width * 0.5, height * 0.5, 'ui_background').setDisplaySize(width, height);
        this.add.image(width * 0.5, height * 0.9, 'ui_car_rail').setOrigin(0.5).setScale(layoutScale * 0.25);
        this.add.image(width * 0.5, height, 'ui_bottom_tint').setOrigin(0.5, 1).setDisplaySize(width, height * 0.15);

        this.carStage = new CarComponent(this, width * 0.70, height * 0.53, 'car_hyryder_initial');
        this.carStage.setScale(layoutScale * 0.5);
        this.carStage.setInteractive({ dropZone: true });

        this.navbar = new NavbarComponent(this, 0, 0, width, height);
        this.navbar.updateScore(this.totalScore); 

        this.events.on('TIMEOUT', this.handleTimeout, this);

        this.videoStage = new VideoComponent(this, width * 0.5, height * 0.5, width, height);

        this.hintCounter = new HintComponent(this, width * 0.88, height * 0.18, width, height, layoutScale);
        this.hintCounter.setScale(layoutScale * 1.2);
        this.hintCounter.setDepth(999); 
        this.events.on('REQUEST_HINT', this.handleHintRequest, this);

        this.questionBox = new QuestionComponent(this, width * 0.25, height * 0.13);
        this.questionBox.setScale(layoutScale * 1.1);
        this.questionBox.setData('homeX', width * 0.25);
        this.questionBox.setData('homeY', height * 0.13);

        const gridLeft = width * 0.12;
        const gridTop = height * 0.45;
        const columnSpacing = width * 0.2;
        const rowSpacing = height * 0.22;

        for (let i = 0; i < 4; i++) {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const xPos = gridLeft + col * columnSpacing;
            const yPos = gridTop + row * rowSpacing;

            const optionCard = new OptionComponent(this, xPos, yPos);
            optionCard.setScale(layoutScale * 1.75);
            
            optionCard.setData('homeX', xPos);
            optionCard.setData('homeY', yPos);
            
            this.options.push(optionCard);
        }

        this.setupDragLogic();
        // this.loadQuestion(this.currentQuestionIndex);

        this.setupLanguageSelector();
        this.loadQuestion(this.currentQuestionIndex);
    }

    private stopQuestionLoadAudio() {
        this.sound.stopByKey('question_load');
    }

    private loadQuestion(index: number) {
        this.isTransitioning = false;
        this.wrongAttempts = 0;
        this.hintsViewed = false;
        this.hintsUsed = 0;
        this.hintCounter.hideAll();
        this.options.forEach(option => option.hide());

        // Initialize tracking metrics for this specific step
        this.stepStartTime = Date.now();
        const currentQData = this.quizData[index];
        
        this.currentStep = {
            questionId: currentQData.processId,
            stepNo: index + 1,
            shownOptions: currentQData.options.map((option: any) => ({
                ...option,
                label: this.t(option.label)
            })),
            wrongAttempts: 0,
            pointsAwarded: 0,
            isCorrect: false,
            timeTaken: 0,
            hintUsed: 0,
            events: []
        };

        if (currentQData.kind === QuestionKind.COLOUR_PICK) {
            this.questionBox.setQuestion(this.t(currentQData.header), this.t(currentQData.instruction));
            this.carStage.updateState(currentQData.carTexture);
            this.navbar.setStepCount(index + 1, this.quizData.length);
            this.showColorSelectionStep();
            return;
        }

        if (currentQData.kind === QuestionKind.CONFIRM) {
            this.questionBox.setQuestion(this.t(currentQData.header), this.t(currentQData.instruction));
            this.carStage.updateState(currentQData.carTexture);
            this.navbar.setStepCount(index + 1, this.quizData.length);
            this.navbar.stopTimer();
            this.time.delayedCall(PROCESS_PURPOSE_TIME_LIMIT, () => this.completeConfirmationStep());
            return;
        }

        if (!this.sound.get('question_load')?.isPlaying) {
            this.stopQuestionLoadAudio();
            this.sound.play('question_load');
        }

        const questionData = this.quizData[index];
        this.questionBox.setQuestion(this.t(questionData.header), this.t(questionData.instruction));
        this.carStage.updateState(questionData.carTexture);
        this.navbar.setStepCount(index + 1, this.quizData.length);

        this.tweens.killTweensOf(this.questionBox);
        this.questionBox.setAlpha(1);
        this.questionBox.x = -this.questionBox.width;
        this.questionBox.y = this.questionBox.getData('homeY');

        this.tweens.add({
            targets: this.questionBox,
            x: this.questionBox.getData('homeX') ?? this.scale.width * 0.25,
            duration: 2200,
            ease: 'Back.easeOut',
            easeParams: [1.4]
        });

        console.log(`Loading question ${index + 1}: processId=${questionData.processId}, isColorPick=${questionData.isColorPick}`);

        const dealOriginX = this.scale.width * 0.05;
        const dealOriginY = this.scale.height * 1.1;

        questionData.options.forEach((optData, i) => {
            // console.log(`Preparing option ${i}: id=${optData.id}, label=${this.t(optData.label)}, imageKey=${optData.imageKey}`);
            const optComponent = this.options[i];
            optComponent.updateData(optData.id, this.t(optData.label), optData.imageKey);
            optComponent.setVisible(true);
            optComponent.setAlpha(1);
            optComponent.setDepth(i);

            optComponent.x = dealOriginX;
            optComponent.y = dealOriginY;

            this.tweens.add({
                targets: optComponent,
                x: optComponent.getData('homeX'),
                y: optComponent.getData('homeY'),
                duration: 380,
                delay: i * 270,
                ease: 'Cubic.easeOut',
                onComplete: () => {
                    if (typeof optComponent['playLandingGlow'] === 'function') {
                        (optComponent as any).playLandingGlow();
                    }
                }
            });
        });

        this.navbar.resetTimer();
    }

    private handleHintRequest() {
        if (this.isTransitioning || this.awaitingColorSelection || this.quizData[this.currentQuestionIndex]?.isColorPick) return;

        this.sound.play('audio_tap'); 
        const currentQ = this.quizData[this.currentQuestionIndex];
        const unlockedCount = Math.min(this.wrongAttempts, currentQ.hints.length);

        if (unlockedCount > 0) {
            this.hintsViewed = true;
            this.hintsUsed = Math.max(this.hintsUsed, unlockedCount);
            this.currentStep.hintUsed = this.hintsUsed;
            this.hintCounter.stopPulse();
            const unlockedHints = currentQ.hints.slice(0, unlockedCount);
            const formattedText = unlockedHints.map((hint, i) => `${i + 1}. ${this.t(hint)}`).join('\n\n');
            
            this.hintCounter.openDialog(formattedText, this.uiText('purposeOfThisProcess'));
            this.hintCounter.updateCount(unlockedCount, currentQ.hints.length);
        }
    }

    private handleTimeout() {
        if (this.isTransitioning) return;
        if (this.awaitingColorSelection) return;

        console.log("Time is up! Executing review phase.");
        this.navbar.stopTimer();
        this.sound.play('audio_wrong_choice');
        this.carStage.vibrate();

        this.executeReviewPhase(false, 0);
    }

    private executeReviewPhase(isSuccess: boolean, pointsEarned: number = 0) {
        this.isTransitioning = true;

        if (this.activeDragProxy) {
            this.activeDragProxy.destroy();
            this.activeDragProxy = null;
        }

        this.options.forEach(opt => opt.hide());
        this.navbar.stopTimer();

        // Finalize current step metrics and push to payload
        this.currentStep.isCorrect = isSuccess;
        this.currentStep.pointsAwarded = pointsEarned;
        this.currentStep.timeTaken = (Date.now() - this.stepStartTime) / 1000;
        this.payload.steps.push(this.currentStep);

        const currentQ = this.quizData[this.currentQuestionIndex];
        const correctOption = currentQ.options.find(opt => opt.isCorrect);
        const processName = correctOption ? this.t(correctOption.label) : this.uiText('processFallback');
        // const isBaseCoatStep = this.isBaseCoatStep(currentQ);

        const advanceOrComplete = () => {
            if (this.currentQuestionIndex < this.quizData.length) {
                this.loadQuestion(this.currentQuestionIndex);
            } else {
                this.submitPayload();
            }
        };

        const triggerHintPhase = () => {
            if (isSuccess) {
                this.carStage.updateState(currentQ.successTexture);
            }

            if (currentQ.hints.length === 0) {
                this.currentQuestionIndex++;
                advanceOrComplete();
                return;
            }

            const formattedText = currentQ.hints.map((hint, i) => `${i + 1}. ${this.t(hint)}`).join('\n\n');
            
            const reviewTitle = this.getReviewTitle(currentQ);
            this.hintCounter.forceReviewDialog(formattedText, reviewTitle);

            this.time.delayedCall(PROCESS_PURPOSE_TIME_LIMIT, () => {
                this.hintCounter.closeDialog();
                
                if (!isSuccess) {
                    this.carStage.updateState(currentQ.successTexture);
                }
                
                this.currentQuestionIndex++;

                advanceOrComplete();
            });
        };

        if (isSuccess && currentQ.successVideo) {
            this.videoStage.playVideo(currentQ.successVideo, processName, pointsEarned, () => {
                triggerHintPhase();
            });
        } else {
            triggerHintPhase();
        }
    }

    private showColorSelectionStep() {
        this.isTransitioning = false;
        this.awaitingColorSelection = true;
        this.hintCounter.hideAll();
        this.navbar.stopTimer();

        // Removed the static this.questionBox.setQuestion() overwrite here.
        // It will safely rely on the one you set earlier in loadQuestion().

        this.tweens.killTweensOf(this.questionBox);
        this.questionBox.setAlpha(1);
        this.questionBox.x = -this.questionBox.width;
        this.questionBox.y = this.questionBox.getData('homeY');

        this.tweens.add({
            targets: this.questionBox,
            x: this.questionBox.getData('homeX') ?? this.scale.width * 0.25,
            duration: 2200,
            ease: 'Back.easeOut',
            easeParams: [1.4]
        });

        const dealOriginX = this.scale.width * 0.05;
        const dealOriginY = this.scale.height * 1.1;

        const currentQ = this.quizData[this.currentQuestionIndex];

        // Use dynamic options from the question payload instead of hardcoded COLOR_OPTIONS
        currentQ.options.forEach((colorData, i) => {
            const optComponent = this.options[i];
            
            // Safely extract localized text (supports both raw JSON 'translations' or adapter-mapped 'label')
            const labelText = this.t(colorData.translations || colorData.label);
            
            // Derive image key (e.g. 'option_white') from the English translation
            const rawEnText = this.getEnglishText(colorData.translations ?? colorData.label) || labelText;
            const imageKey = `option_${rawEnText.toLowerCase()}`;

            optComponent.updateData(colorData.id, labelText, imageKey);
            optComponent.setVisible(true);
            optComponent.setAlpha(1);
            optComponent.setDepth(i);

            optComponent.x = dealOriginX;
            optComponent.y = dealOriginY;

            this.tweens.add({
                targets: optComponent,
                x: optComponent.getData('homeX'),
                y: optComponent.getData('homeY'),
                duration: 380,
                delay: i * 270,
                ease: 'Cubic.easeOut',
                onComplete: () => {
                    if (typeof optComponent['playLandingGlow'] === 'function') {
                        (optComponent as any).playLandingGlow();
                    }
                }
            });
        });
    }

    private handleColorSelected(gameObject: OptionComponent) {
        const currentQ = this.quizData[this.currentQuestionIndex];
        const colorData = currentQ.options.find(c => c.id === gameObject.optionId);
        
        if (!colorData) return;

        // Save the exact ID for the final submission payload
        this.colorChoiceId = colorData.id;
        const labelText = this.t(colorData.translations || colorData.label);
        
        console.log(`Color selected: ${colorData.id} (${labelText})`);

        this.sound.play('audio_right_choice');

        // Extract the lowercase english string strictly for dynamic video asset loading
        this.colorChoice = (this.getEnglishText(colorData.translations ?? colorData.label) || labelText).toLowerCase();

        this.currentStep.events.push({
            attemptNo: 1,
            chosenOptionId: colorData.id,
            chosenLabel: labelText,
            isCorrect: true,
            hintRevealed: null
        });
        
        this.currentStep.isCorrect = true;
        this.currentStep.timeTaken = (Date.now() - this.stepStartTime) / 1000;
        this.payload.steps.push(this.currentStep);
        
        this.awaitingColorSelection = false;
        this.options.forEach(opt => opt.hide());

        this.loadAssetsBasedOnColorChoice(this.colorChoice);

        this.load.once('complete', () => {
            this.currentQuestionIndex++;

            if (this.currentQuestionIndex < this.quizData.length) {
                this.loadQuestion(this.currentQuestionIndex);
            } else {
                this.submitPayload();
            }
        });

        this.load.start();
    }

    private setupDragLogic() {
        this.input.on('gameobjectup', (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => {
            if (!this.awaitingColorSelection || this.isTransitioning || this.hintCounter.isHintOpen) return;
            if (!(gameObject instanceof OptionComponent)) return;

            gameObject.clearDragTint();
            this.handleColorSelected(gameObject);
        });

        this.input.on('dragstart', (pointer: Phaser.Input.Pointer, gameObject: OptionComponent) => {
            if (this.isTransitioning || this.hintCounter.isHintOpen) return; 
            
            this.stopQuestionLoadAudio();
            this.sound.play('audio_tap');
            this.children.bringToTop(gameObject);
            gameObject.applyDragTint();

            // 1. Determine the drag asset key dynamically (e.g., 'option_primer' -> 'option_drag_primer')
            const baseKey = gameObject.imageKey;
            const dragKey = baseKey.replace('option_', 'option_drag_');
            
            // 2. Fallback to standard thumbnail if the drag version isn't loaded (like color cards)
            const textureToUse = this.textures.exists(dragKey) ? dragKey : baseKey;

            // 3. Spawn the floating proxy image right under the user's pointer
            this.activeDragProxy = this.add.image(pointer.x, pointer.y, textureToUse);
            this.activeDragProxy.setDepth(2000); // Ensure it floats above all UI

            const targetWidth = 180 * gameObject.scale;
            const targetHeight = 100 * gameObject.scale;
            this.activeDragProxy.setDisplaySize(targetWidth, targetHeight);
        });

        this.input.on('drag', (pointer: Phaser.Input.Pointer, _gameObject: OptionComponent, _dragX: number, _dragY: number) => {
            if (this.isTransitioning || this.hintCounter.isHintOpen) return;
            
            // Move the proxy image to follow the mouse/finger, DO NOT move the gameObject
            if (this.activeDragProxy) {
                this.activeDragProxy.x = pointer.x;
                this.activeDragProxy.y = pointer.y;
            }
        });

        this.input.on('drop', (_pointer: Phaser.Input.Pointer, gameObject: OptionComponent, _dropZone: Phaser.GameObjects.Image) => {
            if (this.isTransitioning || this.hintCounter.isHintOpen) return;

            // Destroy proxy on drop
            if (this.activeDragProxy) {
                this.activeDragProxy.destroy();
                this.activeDragProxy = null;
            }

            gameObject.clearDragTint();

            if (this.awaitingColorSelection) {
                this.handleColorSelected(gameObject);
                return;
            }

            const currentQ = this.quizData[this.currentQuestionIndex];
            const selectedOpt = currentQ.options.find(o => o.id === gameObject.optionId);

            if (selectedOpt && selectedOpt.isCorrect) {
                this.navbar.stopTimer();
                this.sound.play('audio_right_choice');
                
                let pointsEarned = 0;
                if (this.wrongAttempts === 0) {
                    pointsEarned = SCORE_RULES.firstAttempt;
                } else if (this.wrongAttempts === 1) {
                    pointsEarned = this.hintsViewed ? SCORE_RULES.secondAttemptWithHint : SCORE_RULES.secondAttempt;
                } else {
                    pointsEarned = SCORE_RULES.laterAttempt;
                }

                this.currentStep.events.push({
                    attemptNo: this.currentStep.events.length + 1,
                    chosenOptionId: selectedOpt.id,
                    chosenLabel: this.t(selectedOpt.label),
                    isCorrect: true,
                    hintRevealed: this.hintsViewed ? this.wrongAttempts : null
                });

                this.totalScore += pointsEarned;
                this.navbar.updateScore(this.totalScore);
                
                this.executeReviewPhase(true, pointsEarned);

            } else {
                this.sound.play('audio_wrong_choice');
                this.carStage.vibrate();
                
                const droppedOpt = currentQ.options.find(o => o.id === gameObject.optionId);
                if (droppedOpt) {
                    this.currentStep.events.push({
                        attemptNo: this.currentStep.events.length + 1,
                        chosenOptionId: droppedOpt.id,
                        chosenLabel: this.t(droppedOpt.label),
                        isCorrect: false,
                        hintRevealed: this.hintsViewed ? this.wrongAttempts : null
                    });
                }

                const errorText = this.add.text(this.scale.width / 2, this.scale.height / 2, this.uiText('pleaseTryAgain'), {
                    ...TYPOGRAPHY.errorMessage,
                    padding: { x: 25, y: 15 }
                }).setOrigin(0.5).setDepth(1000);

                this.tweens.add({
                    targets: errorText,
                    y: '-=80',
                    alpha: 0,
                    duration: 3200,
                    ease: 'Cubic.easeOut',
                    onComplete: () => errorText.destroy()
                });
                
                ++this.wrongAttempts;
                this.currentStep.wrongAttempts = this.wrongAttempts;
                gameObject.hide(); // Existing logic hides the failed card

                this.time.delayedCall(1000, () => {
                    if (this.wrongAttempts === 1 && currentQ.hints.length > 0) {
                        this.hintCounter.showAndPulse(); 
                    } else if (this.hintCounter.isHintOpen) {
                        this.handleHintRequest(); 
                    }
                });
            }
        });

        this.input.on('dragend', (_pointer: Phaser.Input.Pointer, gameObject: OptionComponent, _dropped: boolean) => {
            if (this.isTransitioning || this.hintCounter.isHintOpen) return;
            
            // Cleanup proxy if dropped outside the target zone
            if (this.activeDragProxy) {
                this.activeDragProxy.destroy();
                this.activeDragProxy = null;
            }
            gameObject.clearDragTint();
        });
    }

    private loadAssetsBasedOnColorChoice(colorChoice: string) {
        const v = this.payload.variant;
        console.log(`Loading video assets for color choice: ${colorChoice} and variant: ${v}`);

        console.log('base_coat_video path:', `assets/videos/${v}/base_coat_${colorChoice}.mp4`);
        console.log('clear_coat_video path:', `assets/videos/${v}/clear_coat_${colorChoice}.mp4`);
        console.log('flashoff_video path:', `assets/videos/${v}/flashoff_${colorChoice}.mp4`);
        console.log('oven_2_video path:', `assets/videos/${v}/oven_2_${colorChoice}.mp4`);

        this.load.video('base_coat_video', `assets/videos/${v}/base_coat_${colorChoice}.mp4`);
        this.load.video('clear_coat_video', `assets/videos/${v}/clear_coat_${colorChoice}.mp4`);
        this.load.video('flash_off_video', `assets/videos/${v}/flash_off_${colorChoice}.mp4`);
        this.load.video('oven_2_video', `assets/videos/${v}/oven_2_${colorChoice}.mp4`);
    }

    private t(textObject: any): string {
        if (typeof textObject === 'string') return textObject; // Fallback if someone forgets to localize a string
        
        const currentLang = this.registry.get('languageCode');
        // Return the requested language, or fallback to English if missing
        return textObject[currentLang] || textObject['en'] || '';
    }

    private getEnglishText(text: unknown): string {
        if (typeof text === 'string') return text;
        if (text && typeof text === 'object' && 'en' in text) {
            const english = (text as Record<string, unknown>).en;
            return typeof english === 'string' ? english : '';
        }
        return '';
    }

    private get language(): LanguageCode {
        return normalizeLanguage(this.registry.get('languageCode'));
    }

    private uiText(key: TranslationKey, params: Record<string, string | number> = {}): string {
        return translate(key, this.language, params);
    }

    private getReviewTitle(question: RuntimeQuizQuestion): string {
        const processName = this.t(question.options.find(opt => opt.isCorrect)?.label ?? this.uiText('processFallback'));
        return this.uiText('purposeOfProcess', { process: processName });
    }

    private completeConfirmationStep() {
        if (this.isTransitioning) return;

        const confirmationByLanguage: Record<LanguageCode, string> = {
            en: 'confirmed',
            hi: 'पुष्टि की गई',
            kn: 'ದೃಢೀಕರಿಸಲಾಗಿದೆ'
        };
        const confirmation = confirmationByLanguage[this.language];

        this.isTransitioning = true;
        this.currentStep.events.push({
            attemptNo: 1,
            chosenOptionId: confirmation,
            chosenLabel: confirmation,
            isCorrect: true,
            hintRevealed: null
        });
        this.currentStep.isCorrect = true;
        this.currentStep.timeTaken = (Date.now() - this.stepStartTime) / 1000;
        this.payload.steps.push(this.currentStep);
        this.currentQuestionIndex++;

        if (this.currentQuestionIndex < this.quizData.length) {
            this.loadQuestion(this.currentQuestionIndex);
        } else {
            void this.submitPayload();
        }
    }

    private setupLanguageSelector() {
        const { width, height } = this.scale;
        
        // Define the available languages mapping your codes to display labels
        const langs: Array<{ code: LanguageCode; label: string }> = [
            { code: 'en', label: this.uiText('languageEnglish') },
            { code: 'hi', label: this.uiText('languageHindi') },
            { code: 'kn', label: this.uiText('languageKannada') }
        ];

        // Position in the bottom right corner, adjusting for padding
        const containerX = width * 0.88; 
        const containerY = height * 0.94;
        
        const langContainer = this.add.container(containerX, containerY);
        langContainer.setDepth(1000); // Keep it above other UI elements

        // UI Dimensions
        const pillWidth = 240;
        const pillHeight = 44;
        const itemWidth = pillWidth / langs.length;

        // 1. Draw Outer Gray Pill Background
        const bgGraphics = this.add.graphics();
        bgGraphics.fillStyle(0xeaeaea, 0.9); 
        bgGraphics.fillRoundedRect(-pillWidth / 2, -pillHeight / 2, pillWidth, pillHeight, 22);
        bgGraphics.lineStyle(2, 0xd0d0d0, 1);
        bgGraphics.strokeRoundedRect(-pillWidth / 2, -pillHeight / 2, pillWidth, pillHeight, 22);
        langContainer.add(bgGraphics);

        // 2. Draw Active Red Pill Highlight
        // Drawn at 0,0 center so we can easily tween its X coordinate
        const highlightGraphics = this.add.graphics();
        highlightGraphics.fillStyle(0xcc0000, 1); // Dark Red
        highlightGraphics.fillRoundedRect(-itemWidth / 2 + 4, -pillHeight / 2 + 4, itemWidth - 8, pillHeight - 8, 18);
        langContainer.add(highlightGraphics);

        const textObjects: Phaser.GameObjects.Text[] = [];

        // 3. Create Text Options and Interactivity
        langs.forEach((lang, index) => {
            // Calculate exact X position relative to the container's center
            const xPos = (-pillWidth / 2) + (itemWidth * index) + (itemWidth / 2);
            
            const textObj = this.add.text(xPos, 0, lang.label, {
                fontFamily: 'Toyota Type', // Update to your project's custom font if needed
                fontSize: '18px',
                fontStyle: 'bold',
                color: '#555555',
                align: 'center'
            }).setOrigin(0.5);

            // Create a large, invisible hit area matching the segment size
            const hitArea = new Phaser.Geom.Rectangle(0, 0, itemWidth, pillHeight);
            textObj.setInteractive({
                hitArea: hitArea,
                hitAreaCallback: Phaser.Geom.Rectangle.Contains,
                useHandCursor: true
            });

            // Center the hit area relative to the text object
            textObj.input!.hitArea.x = -itemWidth / 2;
            textObj.input!.hitArea.y = -pillHeight / 2;

            textObj.on('pointerdown', () => {
                this.sound.play('audio_tap'); 

                console.log(`Language selected: ${lang.code} (${lang.label})`);
                
                // Update Registry & Payload
                this.registry.set('languageCode', lang.code);
                this.payload.languageCode = lang.code;
                this.navbar.updateLanguage(lang.code);
                this.hintCounter.updateLanguage(lang.code);

                console.log(`Registry updated. Current language: ${this.registry.get('languageCode')}`);
                
                // Slide the red highlight to the new selection
                this.tweens.add({
                    targets: highlightGraphics,
                    x: xPos, 
                    duration: 250,
                    ease: 'Cubic.easeOut'
                });

                // Update text colors (white for active, dark gray for inactive)
                textObjects.forEach((t, i) => {
                    t.setColor(i === index ? '#ffffff' : '#555555');
                });

                // Refresh the texts on screen
                this.refreshTranslations();
            });
            
            langContainer.add(textObj);
            textObjects.push(textObj);
        });

        // 4. Initialize the UI state based on the current active language
        const currentLang = this.registry.get('languageCode') || 'en';
        let currentIndex = langs.findIndex(l => l.code === currentLang);
        if (currentIndex === -1) currentIndex = 0;
        
        // Snap the red highlight to the starting position instantly
        highlightGraphics.x = (-pillWidth / 2) + (itemWidth * currentIndex) + (itemWidth / 2);
        
        // Set the initial text colors
        textObjects.forEach((t, i) => {
            t.setColor(i === currentIndex ? '#ffffff' : '#555555');
        });
    }

    private refreshTranslations() {
        const currentQ = this.quizData[this.currentQuestionIndex];
        if (!currentQ) return;

        if (this.awaitingColorSelection) {
            // Apply translations from the JSON
            this.questionBox.setQuestion(
                this.t(currentQ.header || currentQ.translations?.questionText),
                this.t(currentQ.instruction || currentQ.translations?.initialVisualText)
            );

            currentQ.options.forEach((colorData, i) => {
                console.log(`Refreshing color option ${i}: id=${colorData.id}, label=${this.t(colorData.label)}, imageKey=${colorData.imageKey}`);
                const labelText = this.t(colorData.translations || colorData.label);
                
                this.options[i].updateData(colorData.id, labelText);
            });
            return;
        }

        // ... KEEP THE REST OF YOUR EXISTING refreshTranslations CODE BELOW THIS LINE ...
        this.questionBox.setQuestion(
            this.t(currentQ.header), 
            this.t(currentQ.instruction)
        );

        currentQ.options.forEach((optData, i) => {
            const optComponent = this.options[i];
            optComponent.updateData(optData.id, this.t(optData.label));
        });

        if (this.hintCounter.isHintOpen) {
            const hints = this.isTransitioning
                ? currentQ.hints
                : currentQ.hints.slice(0, Math.min(this.wrongAttempts, currentQ.hints.length));
            const formattedText = hints.map((hint, i) => `${i + 1}. ${this.t(hint)}`).join('\n\n');
            const title = this.isTransitioning
                ? this.getReviewTitle(currentQ)
                : this.uiText('purposeOfThisProcess');

            this.hintCounter.updateDialog(formattedText, title);
        }
    }

    private async submitPayload() {
        const finalPayload: SubmitBatchPayload = {
            carColourId: this.colorChoiceId || undefined,
            answers: this.payload.steps.map(step => {
                return {
                    questionId: step.questionId,
                    timeTaken: Math.round(step.timeTaken),
                    hintUsed: step.hintUsed,
                    answers: step.events.map(event => ({
                        attemptNo: event.attemptNo,
                        chosenProcessId: event.chosenOptionId,
                        isCorrect: event.isCorrect
                    }))
                };
            })
        };

        console.log("Quiz Complete! Emitting Final Payload: \n", JSON.stringify(finalPayload, null, 2));

        try {
            const result = await submitGameRun(this.payload.runId, finalPayload);
            this.game.events.emit('GAME_COMPLETE', result);
        } catch (error) {
            console.error('Failed to submit completed game run:', error);
            // TODO Discuss with Viven
            // this.game.events.emit('GAME_SUBMIT_ERROR', error);
        }
    }
}
