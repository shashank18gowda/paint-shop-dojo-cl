export const SUPPORTED_LANGUAGES = ['en', 'kn', 'hi'] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: LanguageCode = 'en';

const translations = {
  en: {
    introTitle: 'PAINTSHOP DOJO',
    introSubtitle: 'Select vehicles for the simulation',
    loadingAssets: 'LOADING ASSETS...',
    loadFailed: 'FAILED TO LOAD. TAP A VEHICLE TO RETRY.',
    hyryderName: 'TOYOTA HYRYDER',
    hycrossName: 'TOYOTA HYCROSS',
    hints: 'Hints!',
    purposeOfThisProcess: 'Purpose of this process',
    purposeOfProcess: 'Purpose of {process}',
    ok: 'OK',
    selectColor: 'Select a Color',
    chooseFinalColor: 'Choose the final body color for the car.',
    black: 'Black',
    blue: 'Blue',
    white: 'White',
    silver: 'Silver',
    pleaseTryAgain: 'Please try again',
    processFallback: 'this process',
    processProgress: 'PROCESS: {current} of {total}',
    employeeId: 'ID: {id}',
    score: 'SCORE: {score}',
    scoreWithPoints: 'SCORE: {score} pts',
    correctAnswer: 'Correct Answer: {answer}',
    correctAnswerWithPoints: 'Correct Answer: {answer}     +{points} points earned!',
    languageEnglish: 'EN',
    languageKannada: 'ಕನ್ನಡ',
    languageHindi: 'हिंदी'
  },
  kn: {
    introTitle: 'ಪೇಂಟ್‌ಶಾಪ್ ಡೋಜೋ',
    introSubtitle: 'ಸಿಮ್ಯುಲೇಷನ್‌ಗಾಗಿ ವಾಹನವನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    loadingAssets: 'ಸಂಪನ್ಮೂಲಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...',
    loadFailed: 'ಲೋಡ್ ಮಾಡಲು ವಿಫಲವಾಯಿತು. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಲು ವಾಹನವನ್ನು ಟ್ಯಾಪ್ ಮಾಡಿ.',
    hyryderName: 'ಟೊಯೊಟಾ ಹೈರೈಡರ್',
    hycrossName: 'ಟೊಯೊಟಾ ಹೈಕ್ರಾಸ್',
    hints: 'ಸುಳಿವುಗಳು!',
    purposeOfThisProcess: 'ಈ ಪ್ರಕ್ರಿಯೆಯ ಉದ್ದೇಶ',
    purposeOfProcess: '{process} ಪ್ರಕ್ರಿಯೆಯ ಉದ್ದೇಶ',
    ok: 'ಸರಿ',
    selectColor: 'ಬಣ್ಣವನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    chooseFinalColor: 'ಕಾರಿನ ಅಂತಿಮ ಬಾಡಿ ಬಣ್ಣವನ್ನು ಆಯ್ಕೆಮಾಡಿ.',
    black: 'ಕಪ್ಪು', blue: 'ನೀಲಿ', white: 'ಬಿಳಿ', silver: 'ಬೆಳ್ಳಿ',
    pleaseTryAgain: 'ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ',
    processFallback: 'ಈ ಪ್ರಕ್ರಿಯೆ',
    processProgress: 'ಪ್ರಕ್ರಿಯೆ: {total} ರಲ್ಲಿ {current}',
    employeeId: 'ಐಡಿ: {id}', score: 'ಸ್ಕೋರ್: {score}', scoreWithPoints: 'ಸ್ಕೋರ್: {score} ಅಂಕಗಳು',
    correctAnswer: 'ಸರಿಯಾದ ಉತ್ತರ: {answer}',
    correctAnswerWithPoints: 'ಸರಿಯಾದ ಉತ್ತರ: {answer}     +{points} ಅಂಕಗಳು!',
    languageEnglish: 'EN', languageKannada: 'ಕನ್ನಡ', languageHindi: 'हिंदी'
  },
  hi: {
    introTitle: 'पेंटशॉप डोजो',
    introSubtitle: 'सिम्युलेशन के लिए वाहन चुनें',
    loadingAssets: 'संसाधन लोड हो रहे हैं...',
    loadFailed: 'लोड नहीं हो सका। पुनः प्रयास के लिए वाहन पर टैप करें।',
    hyryderName: 'टोयोटा हाइराइडर', hycrossName: 'टोयोटा हाइक्रॉस',
    hints: 'संकेत!', purposeOfThisProcess: 'इस प्रक्रिया का उद्देश्य', purposeOfProcess: '{process} का उद्देश्य', ok: 'ठीक है',
    selectColor: 'रंग चुनें', chooseFinalColor: 'कार के लिए अंतिम बॉडी रंग चुनें।',
    black: 'काला', blue: 'नीला', white: 'सफेद', silver: 'सिल्वर', pleaseTryAgain: 'कृपया पुनः प्रयास करें', processFallback: 'यह प्रक्रिया',
    processProgress: 'प्रक्रिया: {total} में से {current}', employeeId: 'आईडी: {id}', score: 'स्कोर: {score}', scoreWithPoints: 'स्कोर: {score} अंक',
    correctAnswer: 'सही उत्तर: {answer}', correctAnswerWithPoints: 'सही उत्तर: {answer}     +{points} अंक प्राप्त!',
    languageEnglish: 'EN', languageKannada: 'ಕನ್ನಡ', languageHindi: 'हिंदी'
  }
} as const;

export type TranslationKey = keyof (typeof translations)['en'];
export type TranslationParams = Record<string, string | number>;

export function isLanguageCode(value: unknown): value is LanguageCode {
  return typeof value === 'string' && SUPPORTED_LANGUAGES.includes(value as LanguageCode);
}

export function normalizeLanguage(value: unknown): LanguageCode {
  return isLanguageCode(value) ? value : DEFAULT_LANGUAGE;
}

export function translate(key: TranslationKey, language: unknown = DEFAULT_LANGUAGE, params: TranslationParams = {}): string {
  const locale = normalizeLanguage(language);
  const template: string = translations[locale][key] ?? translations[DEFAULT_LANGUAGE][key];
  return template.replace(/\{(\w+)\}/g, (match, name: string) => String(params[name] ?? match));
}
