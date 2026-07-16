import { useFlowStore, type LangCode } from "../store/flow";

// ─── Namespace definitions ────────────────────────────────────────────────────

const translations = {
  welcome: {
    EN: {
      tagline: "Skill. Color. Perfection.",
      cta: "Start Learning Session",
      help: "Need Help? Contact",
    },
    KN: {
      tagline: "ಕೌಶಲ್ಯ. ಬಣ್ಣ. ಪರಿಪೂರ್ಣತೆ.",
      cta: "ಕಲಿಕೆ ಆರಂಭಿಸಿ",
      help: "ಸಹಾಯ ಬೇಕೇ? ಸಂಪರ್ಕಿಸಿ",
    },
    HI: {
      tagline: "कौशल. रंग. पूर्णता.",
      cta: "सीखना शुरू करें",
      help: "सहायता चाहिए? संपर्क करें",
    },
  },

  language: {
    EN: {
      title: "Select Language",
      subtitle:
        "Choose your preferred language for the training modules and certification exams.",
      cta: "Continue",
    },
    KN: {
      title: "ಭಾಷೆ ಆಯ್ಕೆ ಮಾಡಿ",
      subtitle:
        "ತರಬೇತಿ ಮಾಡ್ಯೂಲ್‌ಗಳು ಮತ್ತು ಪ್ರಮಾಣೀಕರಣ ಪರೀಕ್ಷೆಗಳಿಗೆ ನಿಮ್ಮ ಭಾಷೆ ಆಯ್ಕೆ ಮಾಡಿ.",
      cta: "ಮುಂದುವರಿಸಿ",
    },
    HI: {
      title: "भाषा चुनें",
      subtitle:
        "प्रशिक्षण मॉड्यूल और प्रमाणन परीक्षाओं के लिए अपनी पसंदीदा भाषा चुनें।",
      cta: "जारी रखें",
    },
  },

  participantType: {
    EN: {
      title: "Who are you?",
      subtitle: "Select your role to personalise your training experience.",
      cta: "Continue",
    },
    KN: {
      title: "ನೀವು ಯಾರು?",
      subtitle: "ನಿಮ್ಮ ತರಬೇತಿ ಅನುಭವವನ್ನು ವೈಯಕ್ತೀಕರಿಸಲು ನಿಮ್ಮ ಪಾತ್ರ ಆಯ್ಕೆ ಮಾಡಿ.",
      cta: "ಮುಂದುವರಿಸಿ",
    },
    HI: {
      title: "आप कौन हैं?",
      subtitle:
        "अपने प्रशिक्षण अनुभव को वैयक्तिकृत करने के लिए अपनी भूमिका चुनें।",
      cta: "जारी रखें",
    },
  },

  login: {
    EN: {
      title: "Enter Your Code",
      subtitle: "Use the ID on your TKM badge",
      label: "Your Code",
      placeholder: "e.g. EMP001",
      cta: "Login",
      errorInvalid: "Code not found. Please check and try again.",
      errorFormat:
        "Code must be 3–20 characters and include at least one letter.",
      errorNetwork: "Unable to connect. Please try again.",
    },
    KN: {
      title: "ನಿಮ್ಮ ಕೋಡ್ ನಮೂದಿಸಿ",
      subtitle: "ನಿಮ್ಮ TKM ಬ್ಯಾಡ್ಜ್‌ನಲ್ಲಿರುವ ID ಬಳಸಿ",
      label: "ನಿಮ್ಮ ಕೋಡ್",
      placeholder: "ಉದಾ: EMP001",
      cta: "ಲಾಗಿನ್",
      errorInvalid: "ಕೋಡ್ ಕಂಡುಬಂದಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
      errorFormat:
        "Code must be 3–20 characters and include at least one letter.",
      errorNetwork: "ಸಂಪರ್ಕಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    },
    HI: {
      title: "अपना कोड दर्ज करें",
      subtitle: "अपने TKM बैज पर लिखा ID उपयोग करें",
      label: "आपका कोड",
      placeholder: "जैसे: EMP001",
      cta: "लॉगिन",
      errorInvalid: "कोड नहीं मिला। कृपया दोबारा जांचें।",
      errorFormat:
        "Code must be 3–20 characters and include at least one letter.",
      errorNetwork: "कनेक्ट नहीं हो सका। पुनः प्रयास करें।",
    },
  },

  new_here: {
    EN: {
      title: "First time here? Register with this code.",
      btn_txt: "Register as New Participant",
    },
    KN: {
      title: "ಇಲ್ಲಿಗೆ ಮೊದಲ ಬಾರಿಗೆ ಬಂದಿದ್ದೀರಾ? ಈ ಕೋಡ್‌ನೊಂದಿಗೆ ನೋಂದಾಯಿಸಿ.",
      btn_txt: "ಹೊಸ ಭಾಗವಹಿಸುವವರಾಗಿ ನೋಂದಾಯಿಸಿ",
    },
    HI: {
      title: "पहली बार आए हैं? इस कोड से रजिस्टर करें",
      btn_txt: "नए प्रतिभागी के रूप में पंजीकरण करें",
    },
  },
  register: {
    EN: {
      title: "Create Your Profile",
      subtitle: "You're new here — let's get you set up",
      nameLbl: "Full Name",
      namePlaceholder: "Enter your full name",
      desgLbl: "Your Designation",
      cta: "Continue",
      errorDuplicate:
        "This code is already registered. Try logging in instead.",
      errorNetwork: "Unable to connect. Please try again.",
      wru: "Who are you?",
      prd_line: "Today's Production Line",
      mfd_plant: "Manufacturing Plant",
      create_ac: "Create Account",
      createing_ac: "Creating account…",
    },
    KN: {
      title: "ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ರಚಿಸಿ",
      subtitle: "ನೀವು ಹೊಸಬರು — ನಿಮ್ಮನ್ನು ಸೇರಿಸೋಣ",
      nameLbl: "ಪೂರ್ಣ ಹೆಸರು",
      namePlaceholder: "ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರು ನಮೂದಿಸಿ",
      desgLbl: "ನಿಮ್ಮ ಹುದ್ದೆ",
      cta: "ಮುಂದುವರಿಸಿ",
      errorDuplicate: "ಈ ಕೋಡ್ ಈಗಾಗಲೇ ನೋಂದಾಯಿಸಲಾಗಿದೆ.",
      errorNetwork: "ಸಂಪರ್ಕಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
      wru: "ನೀವು ಯಾರು?",
      prd_line: "ಇಂದಿನ ಉತ್ಪಾದನಾ ಲೈನ್",
      mfd_plant: "ಮ್ಯಾನುಫ್ಯಾಕ್ಚರಿಂಗ್ ಪ್ಲಾಂಟ್",
      create_ac: "ಖಾತೆ ರಚಿಸಿ",
      createing_ac: "ಖಾತೆ ರಚಿಸಲಾಗುತ್ತಿದೆ…",
    },
    HI: {
      title: "अपना प्रोफ़ाइल बनाएं",
      subtitle: "आप नए हैं — आइए आपको सेट अप करें",
      nameLbl: "पूरा नाम",
      namePlaceholder: "अपना पूरा नाम दर्ज करें",
      desgLbl: "आपका पदनाम",
      cta: "जारी रखें",
      errorDuplicate: "यह कोड पहले से पंजीकृत है। लॉगिन करने का प्रयास करें।",
      errorNetwork: "कनेक्ट नहीं हो सका। पुनः प्रयास करें।",
      wru: "आप कौन हैं?",
      prd_line: "आज की उत्पादन लाइन",
      mfd_plant: "निर्माण संयंत्र",
      create_ac: "खाता बनाएं",
      createing_ac: "खाता बनाया जा रहा है…",
    },
  },

  confirm: {
    EN: {
      title: "Confirm Your Details",
      subtitle: "Verify your information before starting",
      nameLbl: "Full Name",
      designationLbl: "Designation",
      lineLbl: "Today's Line",
      cta: "Confirm & Continue",
      notYou: "Not you? Go back",
    },
    KN: {
      title: "ವಿವರಗಳನ್ನು ದೃಢೀಕರಿಸಿ",
      subtitle: "ಪ್ರಾರಂಭಿಸುವ ಮೊದಲು ನಿಮ್ಮ ಮಾಹಿತಿ ಪರಿಶೀಲಿಸಿ",
      nameLbl: "ಪೂರ್ಣ ಹೆಸರು",
      designationLbl: "ಹುದ್ದೆ",
      lineLbl: "ಇಂದಿನ ಲೈನ್",
      cta: "ದೃಢೀಕರಿಸಿ & ಮುಂದುವರಿಸಿ",
      notYou: "ನೀವಲ್ಲವೇ? ಹಿಂದೆ ಹೋಗಿ",
    },
    HI: {
      title: "विवरण की पुष्टि करें",
      subtitle: "शुरू करने से पहले अपनी जानकारी सत्यापित करें",
      nameLbl: "पूरा नाम",
      designationLbl: "पदनाम",
      lineLbl: "आज की लाइन",
      cta: "पुष्टि करें और जारी रखें",
      notYou: "आप नहीं? वापस जाएं",
    },
  },

  photo: {
    EN: {
      title: "Take Your Photo",
      subtitle: "Position your face in the frame",
      confirm: "Use This Photo",
      retake: "Retake",
      skip: "Skip for now",
      error1:
        "No camera device found. Please connect a camera and refresh the page.",
      error2:
        "Unable to start the camera. Please refresh the page and try again.",
      cam_face:
        "Face the camera directly and make sure your face fills the circle.",
      start_camera: "Start camera",
      capture_photo: "Capture Photo",
      try_again: "Try Again",
    },
    KN: {
      title: "ಫೋಟೋ ತೆಗೆದುಕೊಳ್ಳಿ",
      subtitle: "ನಿಮ್ಮ ಮುಖವನ್ನು ಫ್ರೇಮ್‌ನಲ್ಲಿ ಇರಿಸಿ",
      confirm: "ಈ ಫೋಟೋ ಬಳಸಿ",
      retake: "ಮತ್ತೆ ತೆಗೆಯಿರಿ",
      skip: "ಈಗ ಬಿಟ್ಟುಬಿಡಿ",
      error1:
        "ಯಾವುದೇ ಕ್ಯಾಮೆರಾ ಸಾಧನ ಕಂಡುಬಂದಿಲ್ಲ. ದಯವಿಟ್ಟು ಕ್ಯಾಮೆರಾವನ್ನು ಸಂಪರ್ಕಿಸಿ ಮತ್ತು ಪುಟವನ್ನು ರಿಫ್ರೆಶ್ ಮಾಡಿ.",
      error2:
        "ಕ್ಯಾಮೆರಾ ಪ್ರಾರಂಭಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಪುಟವನ್ನು ರಿಫ್ರೆಶ್ ಮಾಡಿ ಮತ್ತು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
      cam_face:
        "ಕ್ಯಾಮೆರಾ ನೇರವಾಗಿ ಮುಖದ ಕಡೆ ಇರಿಸಿ ಮತ್ತು ನಿಮ್ಮ ಮುಖ ವೃತ್ತವನ್ನು ತುಂಬುವಂತೆ ಮಾಡಿ.",
      start_camera: "ಕ್ಯಾಮೆರಾ ಪ್ರಾರಂಭಿಸಿ",
      capture_photo: "ಫೋಟೋ ತೆಗೆಯಿರಿ",
      try_again: "ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ",
    },
    HI: {
      title: "अपनी फ़ोटो लें",
      subtitle: "अपना चेहरा फ्रेम में रखें",
      confirm: "यह फ़ोटो उपयोग करें",
      retake: "फिर लें",
      skip: "अभी छोड़ें",
      error1:
        "कोई कैमरा डिवाइस नहीं मिला। कृपया एक कैमरा कनेक्ट करें और पृष्ठ को रिफ्रेश करें।",
      error2:
        "कैमरा शुरू करने में असमर्थ। कृपया पृष्ठ को रिफ्रेश करें और पुनः प्रयास करें।",
      cam_face:
        "कैमरे का सीधा सामना करें और सुनिश्चित करें कि आपका चेहरा वृत्त को भरता है।",
      start_camera: "कैमरा शुरू करें",
      capture_photo: "फ़ोटो लें",
      try_again: "फिर से प्रयास करें",
    },
  },

  quiz: {
    EN: {
      title: "Quiz Instructions",
      subtitle: "Read carefully before you start",
      startBtn: "Start Quiz",
      back: "Back",
      questionCount: "10 Questions",
      totalDuration: "5 min total",
      nextBtn: "Next",
      submitBtn: "Submit Quiz",
      submitting: "Submitting…",
      selectAllAnswers: "Select all correct answers",
      selectAnswerWait: "Select an answer or wait for the timer",
      unavailableTitle: "Quiz unavailable",
      unavailableMessage:
        "Quiz questions are not yet available in your selected language.",
      cooldownTitle: "Quiz unavailable",
      cooldownPassed:
        "You've already passed the quiz. The next attempt unlocks after the certification cooldown.",
      cooldownRetry:
        "You can retake the quiz after the cooldown period from your last attempt.",
      lastAttempt: "Last attempt",
      availableOn: "Available on",
      timeRemaining: "Time remaining",
      viewHistoryHint:
        "You can still view past attempts, certificates, and the leaderboard from the menu.",
      passedLabel: "Passed",
      didNotPassLabel: "Did not pass",
      day: "day",
      days: "days",
      goBack: "Go Back",
      rules: [
        "10 randomly selected questions will appear",
        "You have 5 minutes total — a global timer counts down for the whole quiz",
        "You cannot go back to a previous question",
        "When time runs out, the quiz is automatically submitted",
        "Your final score determines your performance level",
      ],
    },
    KN: {
      title: "ಕ್ವಿಜ್ ಸೂಚನೆಗಳು",
      subtitle: "ಪ್ರಾರಂಭಿಸುವ ಮೊದಲು ಎಚ್ಚರಿಕೆಯಿಂದ ಓದಿ",
      startBtn: "ಕ್ವಿಜ್ ಪ್ರಾರಂಭಿಸಿ",
      back: "ಹಿಂದೆ",
      questionCount: "10 ಪ್ರಶ್ನೆಗಳು",
      totalDuration: "5 ನಿಮಿಷ ಒಟ್ಟು",
      nextBtn: "ಮುಂದೆ",
      submitBtn: "క్వಿಜ್ ಸಲ್ಲಿಸಿ",
      submitting: "ಸಲ್ಲಿಸಲಾಗುತ್ತಿದೆ…",
      selectAllAnswers: "ಎಲ್ಲಾ ಸರಿಯಾದ ಉತ್ತರಗಳನ್ನು ಆಯ್ಕೆಮಾಡಿ",
      selectAnswerWait: "ಉತ್ತರವನ್ನು ಆಯ್ಕೆಮಾಡಿ ಅಥವಾ ಟೈಮರ್‌ನಿಗಾಗಿ ಕಾಯಿರಿ",
      unavailableTitle: "ಕ್ವಿಜ್ ಲಭ್ಯವಿಲ್ಲ",
      unavailableMessage:
        "ನಿಮ್ಮ ಆಯ್ಕೆ ಮಾಡಿದ ಭಾಷೆಯಲ್ಲಿ ಕ್ವಿಜ್ ಪ್ರಶ್ನೆಗಳು ಇನ್ನೂ ಲಭ್ಯವಿಲ್ಲ.",
      cooldownTitle: "ಕ್ವಿಜ್ ಲಭ್ಯವಿಲ್ಲ",
      cooldownPassed:
        "ನೀವು ಈಗಾಗಲೇ ಕ್ವಿಜ್ ಪಾಸು ಮಾಡಿಕೊಂಡಿದ್ದೀರಿ. ಪ್ರಮಾಣೀಕರಣ ಕುಲ್ಡೌನ್ ನಂತರ ಮುಂದಿನ ಪ್ರಯತ್ನ ಅನ್ಲಾಕ್ ಆಗುತ್ತದೆ.",
      cooldownRetry:
        "ಕಳೆದ ಪ್ರಯತ್ನದ ಕುಲ್ಡೌನ್ ಅವಧಿಯ ನಂತರ ನೀವು ಮತ್ತೊಮ್ಮೆ ಕ್ವಿಜ್ ಪ್ರಯತ್ನಿಸಬಹುದು.",
      lastAttempt: "ಕಳೆದ ಪ್ರಯತ್ನ",
      availableOn: "ಲಭ್ಯವಾಗುವ ದಿನಾಂಕ",
      timeRemaining: "ಉಳಿದ ಸಮಯ",
      viewHistoryHint:
        "ಮೆನುವಿನಿಂದ ನೀವು ಹಳೆಯ ಪ್ರಯತ್ನಗಳು, ಪ್ರಮಾಣಪತ್ರಗಳು ಮತ್ತು ಲೀಡರ್‌ಬೋರ್ಡ್ ಅನ್ನು ಇನ್ನೂ ವೀಕ್ಷಿಸಬಹುದು.",
      passedLabel: "ಉದುದ್ದೇಶಿಸಲಾಗಿದೆ",
      didNotPassLabel: "ಉತ್ತರಿಸಲಿಲ್ಲ",
      day: "ದಿನ",
      days: "ದಿನಗಳು",
      goBack: "ಹಿಂದೆ ಹೋಗಿ",
      rules: [
        "10 ಯಾದೃಚ್ಛಿಕ ಪ್ರಶ್ನೆಗಳು ತೋರಿಸಲಾಗುತ್ತದೆ",
        "ಇಡೀ ಕ್ವಿಜ್‌ಗೆ 5 ನಿಮಿಷ ಒಟ್ಟು ಸಮಯ ಇದೆ — ಒಂದು ಜಾಗತಿಕ ಟೈಮರ್ ಎಣಿಸುತ್ತದೆ",
        "ಹಿಂದಿನ ಪ್ರಶ್ನೆಗೆ ಹಿಂತಿರುಗಲು ಸಾಧ್ಯವಿಲ್ಲ",
        "ಸಮಯ ಮುಗಿದಾಗ ಕ್ವಿಜ್ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಸಲ್ಲಿಸಲ್ಪಡುತ್ತದೆ",
        "ನಿಮ್ಮ ಅಂತಿಮ ಅಂಕ ಕಾರ್ಯಕ್ಷಮತೆ ಮಟ್ಟ ನಿರ್ಧರಿಸುತ್ತದೆ",
      ],
    },
    HI: {
      title: "क्विज़ निर्देश",
      subtitle: "शुरू करने से पहले ध्यान से पढ़ें",
      startBtn: "क्विज़ शुरू करें",
      back: "वापस",
      questionCount: "10 प्रश्न",
      totalDuration: "5 मिनट कुल",
      nextBtn: "आगे",
      submitBtn: "क्विज़ जमा करें",
      submitting: "जमा किया जा रहा है…",
      selectAllAnswers: "सभी सही उत्तर चुनें",
      selectAnswerWait: "उत्तर चुनें या टाइमर का इंतजार करें",
      unavailableTitle: "क्विज़ उपलब्ध नहीं है",
      unavailableMessage:
        "आपकी चुनी हुई भाषा में क्विज़ प्रश्न अभी उपलब्ध नहीं हैं।",
      cooldownTitle: "क्विज़ उपलब्ध नहीं है",
      cooldownPassed:
        "आपने पहले ही क्विज़ पास कर लिया है। प्रमाणन कूलडाउन के बाद अगला प्रयास उपलब्ध होगा।",
      cooldownRetry:
        "आप पिछले प्रयास की कूलडाउन अवधि के बाद क्विज़ फिर से दे सकते हैं।",
      lastAttempt: "पिछला प्रयास",
      availableOn: "उपलब्धता की तारीख",
      timeRemaining: "शेष समय",
      viewHistoryHint:
        "आप अभी भी मेनू से पिछले प्रयास, प्रमाण पत्र, और लीडरबोर्ड देख सकते हैं।",
      passedLabel: "पास",
      didNotPassLabel: "नहीं पास",
      day: "दिन",
      days: "दिन",
      goBack: "वापस जाएं",
      rules: [
        "10 यादृच्छिक रूप से चुने गए प्रश्न दिखाए जाएंगे",
        "पूरी क्विज़ के लिए 5 मिनट कुल हैं — एक वैश्विक टाइमर चलता है",
        "पिछले प्रश्न पर वापस नहीं जा सकते",
        "समय समाप्त होने पर क्विज़ स्वतः जमा हो जाएगी",
        "आपका अंतिम स्कोर प्रदर्शन स्तर निर्धारित करता है",
      ],
    },
  },

  game: {
    EN: {
      title: "Game Instructions",
      subtitle: "Read carefully before you start",
      startBtn: "Start Game",
      back: "Back",
      cooldownTitle: "Game unavailable",
      cooldownPassed:
        "You've already completed the game. The next attempt unlocks after the certification cooldown.",
      cooldownRetry:
        "You can replay the game after the cooldown period from your last attempt.",
      lastAttempt: "Last attempt",
      availableOn: "Available on",
      timeRemaining: "Time remaining",
      viewHistoryHint:
        "You can still view past attempts, certificates, and the leaderboard from the menu.",
      passedLabel: "Passed",
      didNotPassLabel: "Did not pass",
      day: "day",
      days: "days",
      goBack: "Go Back",
      rules: [
        "Pick a car model, then choose the correct next process at each step of the paint line",
        "A wrong choice reveals a hint and costs points",
        "Your final score determines your judgement band",
      ],
    },
    KN: {
      title: "ಆಟದ ಸೂಚನೆಗಳು",
      subtitle: "ಪ್ರಾರಂಭಿಸುವ ಮೊದಲು ಎಚ್ಚರಿಕೆಯಿಂದ ಓದಿ",
      startBtn: "ಆಟ ಆರಂಭಿಸಿ",
      back: "ಹಿಂದೆ",
      cooldownTitle: "ಆಟ ಲಭ್ಯವಿಲ್ಲ",
      cooldownPassed:
        "ನೀವು ಈಗಾಗಲೇ ಆಟವನ್ನು ಪೂರ್ಣಗೊಳಿಸಿದ್ದೀರಿ. ಪ್ರಮಾಣೀಕರಣ ಕುಲ್ಡೌನ್ ನಂತರ ಮುಂದಿನ ಪ್ರಯತ್ನ ಅನ್ಲಾಕ್ ಆಗುತ್ತದೆ.",
      cooldownRetry:
        "ಕಳೆದ ಪ್ರಯತ್ನದ ಕುಲ್ಡೌನ್ ಅವಧಿಯ ನಂತರ ನೀವು ಮತ್ತೊಮ್ಮೆ ಆಟ ಆಡಬಹುದು.",
      lastAttempt: "ಕಳೆದ ಪ್ರಯತ್ನ",
      availableOn: "ಲಭ್ಯವಾಗುವ ದಿನಾಂಕ",
      timeRemaining: "ಉಳಿದ ಸಮಯ",
      viewHistoryHint:
        "ಮೆನುವಿನಿಂದ ನೀವು ಹಳೆಯ ಪ್ರಯತ್ನಗಳು, ಪ್ರಮಾಣಪತ್ರಗಳು ಮತ್ತು ಲೀಡರ್‌ಬೋರ್ಡ್ ಅನ್ನು ಇನ್ನೂ ವೀಕ್ಷಿಸಬಹುದು.",
      passedLabel: "ಪಾಸ್",
      didNotPassLabel: "ಪಾಸ್ ಆಗಿಲ್ಲ",
      day: "ದಿನ",
      days: "ದಿನಗಳು",
      goBack: "ಹಿಂದೆ ಹೋಗಿ",
      rules: [
        "ಕಾರ್ ಮಾದರಿಯನ್ನು ಆಯ್ಕೆಮಾಡಿ, ನಂತರ ಪೇಂಟ್ ಲೈನ್‌ನ ಪ್ರತಿ ಹಂತದಲ್ಲಿ ಸರಿಯಾದ ಮುಂದಿನ ಪ್ರಕ್ರಿಯೆ ಆಯ್ಕೆಮಾಡಿ",
        "ತಪ್ಪು ಆಯ್ಕೆ ಸುಳಿವನ್ನು ತೋರಿಸುತ್ತದೆ ಮತ್ತು ಅಂಕಗಳನ್ನು ಕಳೆಯುತ್ತದೆ",
        "ನಿಮ್ಮ ಅಂತಿಮ ಅಂಕ ನಿಮ್ಮ ತೀರ್ಪು ಶ್ರೇಣಿಯನ್ನು ನಿರ್ಧರಿಸುತ್ತದೆ",
      ],
    },
    HI: {
      title: "गेम निर्देश",
      subtitle: "शुरू करने से पहले ध्यान से पढ़ें",
      startBtn: "गेम शुरू करें",
      back: "वापस",
      cooldownTitle: "गेम उपलब्ध नहीं है",
      cooldownPassed:
        "आपने पहले ही गेम पूरा कर लिया है। प्रमाणन कूलडाउन के बाद अगला प्रयास उपलब्ध होगा।",
      cooldownRetry:
        "आप पिछले प्रयास की कूलडाउन अवधि के बाद गेम फिर से खेल सकते हैं।",
      lastAttempt: "पिछला प्रयास",
      availableOn: "उपलब्धता की तारीख",
      timeRemaining: "शेष समय",
      viewHistoryHint:
        "आप अभी भी मेनू से पिछले प्रयास, प्रमाण पत्र, और लीडरबोर्ड देख सकते हैं।",
      passedLabel: "पास",
      didNotPassLabel: "नहीं पास",
      day: "दिन",
      days: "दिन",
      goBack: "वापस जाएं",
      rules: [
        "एक कार मॉडल चुनें, फिर पेंट लाइन के हर चरण पर सही अगली प्रक्रिया चुनें",
        "गलत चुनाव एक संकेत दिखाता है और अंक काटता है",
        "आपका अंतिम स्कोर आपका निर्णय बैंड तय करता है",
      ],
    },
  },

  menu: {
    EN: {
      quiz: "Training Assessment Quiz",
      quizSub: "Assessment for PaintShop Dojo certification.",
      quizCta: "Start Assessment",
      game: "Paint Shop Process Game",
      gameSub: "Pick the next process at each step of the paint line.",
      gameCta: "Start Game",
      certificates: "Certificates",
      certSub: "Access your training certificates.",
      certCta: "View Certificates",
      leaderboard: "Leaderboard",
      lbSub: "Track your ranking among colleagues.",
      lbCta: "View Rankings",
      attempts: "Previous Attempts",
      attSub: "Check past results and improve.",
      attCta: "Open History",
      profile: "Check Profile",
      profileSub: "Check your profile & update.",
      profileCta: "Open Profile",
      profileTitle: "My Profile",
      certificatesTitle: "My Certificates",
      attemptsTitle: "My Attempts",
      takeQuiz: "Take a Quiz",
      tagline: "Skill. Color. Perfection.",
    },
    KN: {
      tagline: "ಕೌಶಲ್ಯ. ಬಣ್ಣ. ಪರಿಪೂರ್ಣತೆ.",
      quiz: "ತರಬೇತಿ ಮೌಲ್ಯಮಾಪನ",
      quizSub: "ಪೇಂಟ್‌ಶಾಪ್ ಡೋಜೋ ಪ್ರಮಾಣೀಕರಣಕ್ಕಾಗಿ ಮೌಲ್ಯಮಾಪನ.",
      quizCta: "ಆರಂಭಿಸಿ",
      game: "ಪೇಂಟ್ ಶಾಪ್ ಪ್ರಕ್ರಿಯೆ ಆಟ",
      gameSub: "ಪೇಂಟ್ ಲೈನ್‌ನ ಪ್ರತಿ ಹಂತದಲ್ಲಿ ಮುಂದಿನ ಪ್ರಕ್ರಿಯೆ ಆಯ್ಕೆಮಾಡಿ.",
      gameCta: "ಆಟ ಆರಂಭಿಸಿ",
      certificates: "ಪ್ರಮಾಣಪತ್ರಗಳು",
      certSub: "ನಿಮ್ಮ ತರಬೇತಿ ಪ್ರಮಾಣಪತ್ರಗಳನ್ನು ನೋಡಿ.",
      certCta: "ವೀಕ್ಷಿಸಿ",
      leaderboard: "ಲೀಡರ್‌ಬೋರ್ಡ್",
      lbSub: "ಸಹೋದ್ಯೋಗಿಗಳಲ್ಲಿ ನಿಮ್ಮ ಶ್ರೇಣಿ ಟ್ರ್ಯಾಕ್ ಮಾಡಿ.",
      lbCta: "ನೋಡಿ",
      attempts: "ಹಿಂದಿನ ಪ್ರಯತ್ನಗಳು",
      attSub: "ಹಿಂದಿನ ಫಲಿತಾಂಶಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.",
      attCta: "ತೆರೆಯಿರಿ",
      profile: "ಪ್ರೊಫೈಲ್ ನೋಡಿ",
      profileSub: "ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ಪರಿಶೀಲಿಸಿ.",
      profileCta: "ತೆರೆಯಿರಿ",
      profileTitle: "ನನ್ನ ಪ್ರೊಫೈಲ್",
      certificatesTitle: "ನನ್ನ ಪ್ರಮಾಣಪತ್ರಗಳು",
      attemptsTitle: "ನನ್ನ ಪ್ರಯತ್ನಗಳು",
      takeQuiz: "ಕ್ವಿಜ್ ತೆಗೆದುಕೊಳ್ಳಿ",
    },
    HI: {
      tagline: "कौशल. रंग. पूर्णता.",
      quiz: "प्रशिक्षण मूल्यांकन",
      quizSub: "पेंटशॉप डोजो सर्टिफिकेशन के लिए मूल्यांकन.",
      quizCta: "शुरू करें",
      game: "पेंट शॉप प्रोसेस गेम",
      gameSub: "पेंट लाइन के हर चरण पर अगली प्रक्रिया चुनें.",
      gameCta: "गेम शुरू करें",
      certificates: "प्रमाणपत्र",
      certSub: "अपने प्रशिक्षण प्रमाणपत्र देखें.",
      certCta: "देखें",
      leaderboard: "लीडरबोर्ड",
      lbSub: "सहकर्मियों में अपनी रैंकिंग ट्रैक करें.",
      lbCta: "देखें",
      attempts: "पिछले प्रयास",
      attSub: "पिछले परिणाम जांचें और सुधारें.",
      attCta: "खोलें",
      profile: "प्रोफ़ाइल देखें",
      profileSub: "अपनी प्रोफ़ाइल जांचें और अपडेट करें.",
      profileCta: "खोलें",
      profileTitle: "मेरा प्रोफ़ाइल",
      certificatesTitle: "मेरे प्रमाणपत्र",
      attemptsTitle: "मेरे प्रयास",
      takeQuiz: "क्विज़ दें",
    },
  },

  quizResults: {
    EN: {
      title: "Quiz Complete!",
      subtitle: "Here are your results",
      score: "Score",
      correct: "Correct Answers",
      timeTaken: "Time Taken",
      performance: "Performance Level",
      certificate: "Get Certificate",
      retake: "Retake Quiz",
      menu: "Back to Menu",
      leaderboard: "View Leaderboard",
      excellent: "Excellent work! Keep it up.",
      good: "Good job! A little more practice and you'll be at the top.",
      average: "Average performance. Review the topics and try again.",
      needsImprovement: "Keep practicing! You'll get better.",
    },
    KN: {
      title: "ಕ್ವಿಜ್ ಮುಗಿಯಿತು!",
      subtitle: "ನಿಮ್ಮ ಫಲಿತಾಂಶ ಇಲ್ಲಿದೆ",
      score: "ಅಂಕ",
      correct: "ಸರಿಯಾದ ಉತ್ತರಗಳು",
      timeTaken: "ತೆಗೆದ ಸಮಯ",
      performance: "ಕಾರ್ಯಕ್ಷಮತೆ ಮಟ್ಟ",
      certificate: "ಪ್ರಮಾಣಪತ್ರ ಪಡೆಯಿರಿ",
      retake: "ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ",
      menu: "ಮೆನುಗೆ ಹಿಂತಿರುಗಿ",
      leaderboard: "ಲೀಡರ್‌ಬೋರ್ಡ್ ನೋಡಿ",
      excellent: "ಅತ್ಯುತ್ತಮ ಕೆಲಸ! ಮುಂದುವರಿಯಿರಿ.",
      good: "ಉತ್ತಮ! ಸ್ವಲ್ಪ ಹೆಚ್ಚು ಅಭ್ಯಾಸ ಮಾಡಿ.",
      average: "ಸರಾಸರಿ ಕಾರ್ಯಕ್ಷಮತೆ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
      needsImprovement: "ಅಭ್ಯಾಸ ಮುಂದುವರಿಸಿ! ಮುಂದೆ ಉತ್ತಮವಾಗುತ್ತೀರಿ.",
    },
    HI: {
      title: "क्विज़ पूरी हुई!",
      subtitle: "आपके परिणाम यहाँ हैं",
      score: "स्कोर",
      correct: "सही उत्तर",
      timeTaken: "लिया गया समय",
      performance: "प्रदर्शन स्तर",
      certificate: "प्रमाण पत्र प्राप्त करें",
      retake: "दोबारा प्रयास करें",
      menu: "मेनू पर वापस जाएं",
      leaderboard: "लीडरबोर्ड देखें",
      excellent: "बहुत अच्छा! इसे जारी रखें।",
      good: "अच्छा काम! थोड़ा और अभ्यास करें।",
      average: "औसत प्रदर्शन। विषयों की समीक्षा करें और पुनः प्रयास करें।",
      needsImprovement: "अभ्यास जारी रखें! आप बेहतर होंगे।",
    },
  },

  leaderboard: {
    EN: {
      title: "Leaderboard",
      back: "Back",
      topPerformers: "Top Performers",
      filterBy: "Filter By",
      colRank: "Rank",
      colParticipant: "Participant",
      colDesg: "Designation / Line",
      colScore: "%",
      colTime: "Time",
      you: "You",
      empty: "No entries yet",
      emptyHint: "Complete a quiz to appear on the leaderboard",
      takeQuiz: "Take Quiz",
    },
    KN: {
      title: "ಲೀಡರ್‌ಬೋರ್ಡ್",
      back: "ಹಿಂದೆ",
      topPerformers: "ಉತ್ತಮ ಕಾರ್ಯಕ್ಷಮರು",
      filterBy: "ಫಿಲ್ಟರ್",
      colRank: "ಶ್ರೇಣಿ",
      colParticipant: "ಭಾಗವಹಿಸುವವರು",
      colDesg: "ಹುದ್ದೆ / ಲೈನ್",
      colScore: "%",
      colTime: "ಸಮಯ",
      you: "ನೀವು",
      empty: "ಇನ್ನೂ ಯಾವ ನಮೂದು ಇಲ್ಲ",
      emptyHint: "ಲೀಡರ್‌ಬೋರ್ಡ್‌ನಲ್ಲಿ ಬರಲು ಕ್ವಿಜ್ ಮಾಡಿ",
      takeQuiz: "ಕ್ವಿಜ್ ತೆಗೆದುಕೊಳ್ಳಿ",
    },
    HI: {
      title: "लीडरबोर्ड",
      back: "वापस",
      topPerformers: "शीर्ष प्रदर्शनकर्ता",
      filterBy: "फ़िल्टर",
      colRank: "रैंक",
      colParticipant: "प्रतिभागी",
      colDesg: "पदनाम / लाइन",
      colScore: "%",
      colTime: "समय",
      you: "आप",
      empty: "अभी तक कोई प्रविष्टि नहीं",
      emptyHint: "लीडरबोर्ड पर आने के लिए क्विज़ दें",
      takeQuiz: "क्विज़ दें",
    },
  },
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────

type Namespace = keyof typeof translations;
type TranslationMap = typeof translations;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTranslation<N extends Namespace>(
  ns: N,
): TranslationMap[N][LangCode] {
  const lang = useFlowStore((s) => s.lang);
  return (translations[ns][lang] ??
    translations[ns].EN) as TranslationMap[N][LangCode];
}

// For use outside React components (e.g. in utility functions)
export function tr<N extends Namespace>(
  ns: N,
  lang: LangCode,
): TranslationMap[N][LangCode] {
  return (translations[ns][lang] ??
    translations[ns].EN) as TranslationMap[N][LangCode];
}
