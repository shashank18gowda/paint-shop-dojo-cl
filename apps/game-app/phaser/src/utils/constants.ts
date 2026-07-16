export const SCREEN_WIDTH = 1920;
export const SCREEN_HEIGHT = 1080;

export const TIME_LIMIT_PER_QUESTION = 5;
export const PROCESS_PURPOSE_TIME_LIMIT = 1000;
export const COLOR_SELECTION_PURPOSE_TIME = 5000;
export const TIMER_WARNING_THRESHOLD = 10;
export const TIMER_TICK_INTERVAL = 1000;

export const SCORE_RULES = {
  firstAttempt: 20,
  secondAttempt: 15,
  secondAttemptWithHint: 10,
  laterAttempt: 0
} as const;

export const SESSION_DEFAULTS = {
  participantId: 'guest_user',
  flowId: 'flow_8829a',
  variant: 'hyryder',
  maxScore: 1200,
  employeeId: '884291'
} as const;

export const VEHICLES = [
  { id: 'hyryder', imageKey: 'intro_hyryder', translationKey: 'hyryderName' },
  { id: 'hycross', imageKey: 'intro_hycross', translationKey: 'hycrossName' }
] as const;

export const COLOR_OPTIONS = [
  { id: 'color_black', translationKey: 'black', imageKey: 'option_black', value: 'black' },
  { id: 'color_blue', translationKey: 'blue', imageKey: 'option_blue', value: 'blue' },
  { id: 'color_white', translationKey: 'white', imageKey: 'option_white', value: 'white' },
  { id: 'color_silver', translationKey: 'silver', imageKey: 'option_silver', value: 'silver' }
] as const;

export const PROCESS_ASSET_KEYS = [
  'initial', 'degreasing', 'phosphate', 'ed', 'sealer', 'body_prep', 'primer',
  'base_coat', 'clear_coat', 'flash_off', 'oven_1', 'oven_2', 'final'
] as const;

export const TYPOGRAPHY = {
  // Navbar
  navbar: {
    fontSize: '24px',
    color: '#ffffff',
    fontFamily: 'Toyota Type',
    fontStyle: 'bold'
  },
  // Question component
  questionHeader: {
    fontSize: '36px',
    color: '#ffffff',
    fontFamily: 'Toyota Type',
    fontStyle: 'bold'
  },
  questionInstruction: {
    fontSize: '32px',
    color: '#000000',
    fontFamily: 'Toyota Type'
  },
  // Hint component
  hintTitle: {
    fontSize: '26px',
    color: '#000000',
    fontFamily: 'Toyota Type',
    fontStyle: 'bold'
  },
  hintHeaderTitle: {
    fontSize: '26px',
    color: '#ffffff',
    fontFamily: 'Toyota Type',
    fontStyle: 'bold'
  },
  hintPopup: {
    fontSize: '28px',
    color: '#000000',
    fontFamily: 'Toyota Type'
  },
  hintOkBtn: {
    fontSize: '22px',
    color: '#ffffff',
    backgroundColor: '#cc0000',
    fontFamily: 'Toyota Type',
    fontStyle: 'bold'
  },
  // Option component
  optionTitle: {
    fontSize: '14px',
    color: '#ffffff',
    fontStyle: 'bold',
    fontFamily: 'Toyota Type'
  },
  // Game Scene Error Message
  errorMessage: {
    fontSize: '42px',
    color: '#ffffff',
    backgroundColor: '#cc0000',
    fontStyle: 'bold',
    fontFamily: 'Toyota Type'
  },
  // Video Component Success Banner
  videoSuccessTitle: {
    fontSize: '32px',
    color: '#ffffff',
    fontStyle: 'bold',
    fontFamily: 'Toyota Type'
  },
  // Intro Scene
  introSystemText: {
    fontFamily: 'Toyota Type',
    color: '#445566'
  },
  introTitleWhite: {
    fontFamily: 'Toyota Type',
    color: '#ffffff',
    fontStyle: 'bold'
  },
  introTitleRed: {
    fontFamily: 'Toyota Type',
    color: '#cc0000',
    fontStyle: 'bold'
  },
  introSubtitle: {
    fontFamily: 'Toyota Type',
    color: '#eeeeee'
  },
  introCardText: {
    fontSize: '32px',
    color: '#000000',
    fontStyle: 'bold',
    fontFamily: 'Toyota Type'
  }
} as const;

export const INTRO_FONTS = {
  headingRed: (scale: number) => ({
    fontFamily: 'Toyota Type, Arial, sans-serif',
    fontSize: `${56 * scale}px`,
    color: '#e60000',
    fontStyle: 'bold'
  }),
  headingWhite: (scale: number) => ({
    fontFamily: 'Toyota Type, Arial, sans-serif',
    fontSize: `${56 * scale}px`,
    color: '#ffffff',
    fontStyle: 'bold'
  }),
  subheading: (scale: number) => ({
    fontFamily: 'Toyota Type, Arial, sans-serif',
    fontSize: `${28 * scale}px`,
    color: '#ffffff'
  }),
  loading: (scale: number) => ({
    fontFamily: 'Toyota Type, monospace',
    fontSize: `${22 * scale}px`,
    color: '#aaaaaa',
    letterSpacing: 4
  }),
  cardTitle: (scale: number) => ({
    fontFamily: 'Toyota Type, Arial, sans-serif',
    fontSize: `${34 * scale}px`,
    color: '#111111',
    fontStyle: 'bold'
  })
} as const;

export const BASE_WIDTH  = 1920;
export const BASE_HEIGHT = 1080;

export function getScale(scene: Phaser.Scene): number {
    const { width, height } = scene.scale;
    return Math.min(width / BASE_WIDTH, height / BASE_HEIGHT);
}

export function getCenter(scene: Phaser.Scene): { x: number; y: number } {
    return { x: scene.scale.width * 0.5, y: scene.scale.height * 0.5 };
}

export function pos(scene: Phaser.Scene, nx: number, ny: number) {
    return { x: scene.scale.width * nx, y: scene.scale.height * ny };
}

export const PROCESS_KEY_MAP: Record<string, string> = {
    "Degreasing": "degreasing",
    "Surface Conditioning & Phosphating": "phosphate",
    "Electrodeposition (ED)": "ed",
    "Oven Bake 1": "oven_1",
    "Sealer & Pre-heat Oven": "sealer",
    "Body Preparation Zone": "body_prep",
    "Primer": "primer",
    "Base Coat": "base_coat",
    "Clear Coat": "clear_coat",
    "Flash-Off": "flash_off",
    "Oven Bake 2 (Final)": "oven_2",
    "Dream Ready": "final",
};
