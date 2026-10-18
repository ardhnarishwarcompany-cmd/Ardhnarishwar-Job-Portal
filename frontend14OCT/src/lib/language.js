// Language helpers for Google Translate based switching

export const getCurrentLang = () => {
  if (typeof document === "undefined") return "en";
  const m = document.cookie.match(/(?:^|;\s*)googtrans=([^;]*)/);
  if (!m) return "en";
  const lang = decodeURIComponent(m[1]).split("/").pop();
  return lang || "en";
};

export const clearGoogTransCookies = () => {
  const host = window.location.hostname;
  const parts = host.split(".");
  const domains = [null, host, "." + host];
  for (let i = 1; i < parts.length - 1; i++) {
    const p = parts.slice(i).join(".");
    domains.push(p, "." + p);
  }
  const expired = "expires=Thu, 01 Jan 1970 00:00:00 GMT";
  domains.forEach((d) => {
    document.cookie = `googtrans=; ${expired}; path=/` + (d ? `; domain=${d}` : "");
  });
};

export const applyLanguageAndReload = (code) => {
  clearGoogTransCookies();
  if (code && code !== "en") {
    document.cookie = `googtrans=/en/${code}; path=/`;
  }
  window.location.reload();
};

// Order: Get hired / Build resumes / Audit ATS / Mock interviews / Chat recruiters
const TYPING_PHRASES = {
  en: ["Get Hired Fast.", "Build AI Resumes.", "Audit ATS Scores.", "AI Mock Interviews.", "Chat with Recruiters."],
  hi: ["जल्दी नौकरी पाएं।", "एआई रिज़्यूमे बनाएं।", "एटीएस स्कोर जांचें।", "एआई मॉक इंटरव्यू दें।", "रिक्रूटर्स से चैट करें।"],
  es: ["Consigue empleo rápido.", "Crea currículums con IA.", "Audita tu puntaje ATS.", "Entrevistas simuladas con IA.", "Chatea con reclutadores."],
  fr: ["Décrochez un poste vite.", "Créez des CV avec l'IA.", "Auditez vos scores ATS.", "Entretiens simulés par IA.", "Discutez avec les recruteurs."],
  de: ["Schnell eingestellt werden.", "KI-Lebensläufe erstellen.", "ATS-Scores prüfen.", "KI-Probeinterviews.", "Mit Recruitern chatten."],
  pt: ["Seja contratado rápido.", "Crie currículos com IA.", "Audite sua pontuação ATS.", "Entrevistas simuladas com IA.", "Converse com recrutadores."],
  it: ["Fatti assumere in fretta.", "Crea CV con l'IA.", "Verifica i punteggi ATS.", "Colloqui simulati con IA.", "Chatta con i recruiter."],
  pa: ["ਜਲਦੀ ਨੌਕਰੀ ਪਾਓ।", "ਏਆਈ ਰਿਜ਼ਿਊਮੇ ਬਣਾਓ।", "ਏਟੀਐਸ ਸਕੋਰ ਜਾਂਚੋ।", "ਏਆਈ ਮੌਕ ਇੰਟਰਵਿਊ।", "ਰਿਕਰੂਟਰਾਂ ਨਾਲ ਗੱਲ ਕਰੋ।"],
  bn: ["দ্রুত চাকরি পান।", "এআই রেজুমে বানান।", "এটিএস স্কোর যাচাই করুন।", "এআই মক ইন্টারভিউ।", "রিক্রুটারদের সাথে চ্যাট করুন।"],
  mr: ["लवकर नोकरी मिळवा.", "एआय रिझ्युमे बनवा.", "एटीएस स्कोअर तपासा.", "एआय मॉक इंटरव्ह्यू.", "रिक्रूटर्सशी चॅट करा."],
  ta: ["விரைவில் வேலை பெறுங்கள்.", "AI ரெஸ்யூம் உருவாக்குங்கள்.", "ATS மதிப்பெண்ணை சரிபார்க்கவும்.", "AI மாதிரி நேர்காணல்கள்.", "ரெக்ரூட்டர்களுடன் அரட்டையடிக்கவும்."],
  te: ["త్వరగా ఉద్యోగం పొందండి.", "AI రెజ్యూమెలు రూపొందించండి.", "ATS స్కోర్‌లను తనిఖీ చేయండి.", "AI మాక్ ఇంటర్వ్యూలు.", "రిక్రూటర్లతో చాట్ చేయండి."],
  gu: ["ઝડપથી નોકરી મેળવો.", "એઆઈ રિઝ્યૂમ બનાવો.", "એટીએસ સ્કોર ચકાસો.", "એઆઈ મોક ઇન્ટરવ્યૂ.", "રિક્રૂટર્સ સાથે ચેટ કરો."],
  ur: ["جلدی نوکری پائیں۔", "اے آئی ریزیومے بنائیں۔", "اے ٹی ایس اسکور جانچیں۔", "اے آئی ماک انٹرویوز۔", "ریکروٹرز سے چیٹ کریں۔"],
  ar: ["احصل على وظيفة بسرعة.", "أنشئ سير ذاتية بالذكاء الاصطناعي.", "افحص درجات ATS.", "مقابلات تجريبية بالذكاء الاصطناعي.", "تحدث مع مسؤولي التوظيف."],
  ru: ["Получите работу быстро.", "Создавайте резюме с ИИ.", "Проверяйте ATS-баллы.", "ИИ-пробные собеседования.", "Общайтесь с рекрутерами."],
  "zh-CN": ["快速找到工作。", "打造AI简历。", "检测ATS评分。", "AI模拟面试。", "与招聘官聊天。"],
  ja: ["すばやく内定を獲得。", "AIで履歴書を作成。", "ATSスコアを診断。", "AI模擬面接。", "採用担当者とチャット。"],
  ko: ["빠르게 취업하세요.", "AI 이력서 만들기.", "ATS 점수 점검.", "AI 모의 면접.", "리크루터와 채팅하세요."],
};

export const getTypingPhrases = (lang) => TYPING_PHRASES[lang] || TYPING_PHRASES.en;
