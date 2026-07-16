import * as Phaser from 'phaser';
import { COLOR_OPTIONS, PROCESS_ASSET_KEYS } from '../../utils/constants';

export default class PreloaderScene extends Phaser.Scene {
    private vehicle!: string;

    constructor() {
        super({ key: 'PreloaderScene' });
    }

    init(data: { vehicle: string }) {
        this.vehicle = data.vehicle;
    }

    preload() {
        const v = this.vehicle;
        console.log(`Preloading assets for vehicle: ${v}`);

        // 2. Loop through and dynamically load dynamic process assets
        PROCESS_ASSET_KEYS.forEach(key => {
            // Note: Make sure your folder structure files match these string names identically.
            this.load.image(`car_${key}`, `assets/images/car/${v}/${key}.png`);
            this.load.image(`option_${key}`, `assets/images/options/${v}/${key}.png`);
            this.load.image(`option_drag_${key}`, `assets/images/options/drag/${key}.png`);
            // this.load.video(`${key}_video`, `assets/videos/${v}/${key}.mp4`);
        });

        // 3. Load static colors
        COLOR_OPTIONS.forEach(({ value }) => {
            this.load.image(`option_${value}`, `assets/images/options/${value}.png`);
        });

        this.load.image(`car_initial`, `assets/images/car/${v}/initial.png`);
        this.load.image(`car_degrease`, `assets/images/car/${v}/degreased.png`);
        this.load.image(`car_phosphate`, `assets/images/car/${v}/phosphated.png`);

        this.load.image('hint1', 'assets/images/hints/hint1.png');
        this.load.image('hint2', 'assets/images/hints/hint2.png');
        this.load.image('hint3', 'assets/images/hints/hint3.png');
        this.load.image('close_hint', 'assets/images/hints/close_hint.png');

        this.load.image('ui_background', 'assets/images/ui/background.png');
        this.load.image('ui_bottom_tint', 'assets/images/ui/bottom_tint.png');
        this.load.image('ui_button_bg', 'assets/images/ui/button_bg.png');
        this.load.image('ui_car_rail', 'assets/images/ui/car_rail.png');
        this.load.image('ui_hint', 'assets/images/ui/hint.png');
        this.load.image('ui_option_tag_black', 'assets/images/ui/option_tag_black.png');
        this.load.image('ui_option_tag_red', 'assets/images/ui/option_tag_red.png');
        this.load.image('ui_profile', 'assets/images/ui/profile.png');
        this.load.image('ui_question_red', 'assets/images/ui/question_red.png');
        this.load.image('ui_question_white', 'assets/images/ui/question_white.png');
        this.load.image('ui_employee_id_bg', 'assets/images/ui/employee_id_bg.png');
        this.load.image('ui_navbar_bg', 'assets/images/ui/navbar_bg.png');
        this.load.image('ui_score_bg', 'assets/images/ui/score_bg.png');
        this.load.image('ui_timer_icon', 'assets/images/ui/timer_icon.png');
        this.load.image('ui_timer_icon_red', 'assets/images/ui/timer_icon_red.png');

        this.load.audio('audio_right_choice', 'assets/audios/right_choice.mp3');
        this.load.audio('audio_wrong_choice', 'assets/audios/wrong_choice.mp3');
        this.load.audio('audio_tap', 'assets/audios/tap.mp3');
        this.load.audio('question_load', 'assets/audios/question_load.mp3');
        this.load.audio('ten_seconds_timer', 'assets/audios/ten_seconds_timer.mp3');

        this.load.image('option_degreasing', `assets/images/options/${v}/degreasing.png`);
        this.load.image('option_primer', `assets/images/options/${v}/primer.png`);
        this.load.image('option_sealer', `assets/images/options/${v}/sealer.png`);
        this.load.image('option_phosphate', `assets/images/options/${v}/phosphated.png`);
        this.load.image('option_ed', `assets/images/options/${v}/ed.png`);
        this.load.image('option_oven_1', `assets/images/options/${v}/oven_1.png`);
        this.load.image('option_body_prep', `assets/images/options/${v}/body_prep.png`);
        this.load.image('option_base', `assets/images/options/${v}/base_coat.png`);
        this.load.image('option_clear_coat', `assets/images/options/${v}/clear_coat.png`);
        this.load.image('option_flash', `assets/images/options/${v}/flash_off.png`);

        this.load.image('option_drag_degreasing', `assets/images/options/drag/degreasing.png`);
        this.load.image('option_drag_body_prep', `assets/images/options/drag/body_prep.png`);
        this.load.image('option_drag_sealer', `assets/images/options/drag/sealer.png`);
        this.load.image('option_drag_phosphate', `assets/images/options/drag/phosphated.png`);

        this.load.image('option_black', `assets/images/options/black.png`);
        this.load.image('option_blue', `assets/images/options/blue.png`);
        this.load.image('option_white', `assets/images/options/white.png`);
        this.load.image('option_silver', `assets/images/options/silver.png`);

        this.load.video('degreasing_video', `assets/videos/${v}/degreasing.mp4`);
        this.load.video('phosphate_video', `assets/videos/${v}/phosphate.mp4`);
        this.load.video('ed_video', `assets/videos/${v}/ed.mp4`);
        this.load.video('oven_1_video', `assets/videos/${v}/oven_1.mp4`);
        this.load.video('sealer_video', `assets/videos/${v}/sealer.mp4`);
        this.load.video('body_prep_video', `assets/videos/${v}/body_prep.mp4`);
        this.load.video('primer_video', `assets/videos/${v}/primer.mp4`);
    }

    create() {
        this.events.emit('ASSETS_READY');
    }
}
