export type CookRecipe = {
  name: string;
  core: string;
  time: string;
  steps?: string[];
  pairing?: string;
};

export type CookPlanDay = {
  breakfast: CookRecipe | null;
  lunch: CookRecipe | null;
  dinner: CookRecipe | null;
};

export type CookLangId = "hi" | "kn" | "bn" | "te" | "ta" | "mr" | "gu" | "ml";

export type CookLanguage = {
  id: CookLangId;
  label: string;
  native: string;
  speechLang: string;
  ttsCode: string;
};

type LangCopy = {
  greeting: string;
  thanks: string;
  recipeToday: (name: string) => string;
  mainIng: (core: string) => string;
  takesMinutes: (mins: string) => string;
  stepsInMessage: (count: number) => string;
  serveWith: (pairing: string) => string;
  watchYt: (name: string) => string;
  menuListen: string;
  breakfast: (name: string, core: string, mins: string) => string;
  lunch: (name: string, core: string, mins: string) => string;
  dinner: (name: string, core: string, mins: string) => string;
  ytLinksBelow: string;
  waRecipeGreeting: (name: string) => string;
  waMinutesMain: (mins: string, core: string) => string;
  waRecipeHint: string;
  waPlanGreeting: string;
  waMealLine: (label: string, name: string, mins: string, core: string) => string;
  mealBreakfast: string;
  mealLunch: string;
  mealDinner: string;
  waYtHint: string;
  minutesUnit: string;
};

export const COOK_LANGUAGES: CookLanguage[] = [
  { id: "hi", label: "Hindi", native: "हिंदी", speechLang: "hi-IN", ttsCode: "hi" },
  { id: "kn", label: "Kannada", native: "ಕನ್ನಡ", speechLang: "kn-IN", ttsCode: "kn" },
  { id: "bn", label: "Bengali", native: "বাংলা", speechLang: "bn-IN", ttsCode: "bn" },
  { id: "te", label: "Telugu", native: "తెలుగు", speechLang: "te-IN", ttsCode: "te" },
  { id: "ta", label: "Tamil", native: "தமிழ்", speechLang: "ta-IN", ttsCode: "ta" },
  { id: "mr", label: "Marathi", native: "मराठी", speechLang: "mr-IN", ttsCode: "mr" },
  { id: "gu", label: "Gujarati", native: "ગુજરાતી", speechLang: "gu-IN", ttsCode: "gu" },
  { id: "ml", label: "Malayalam", native: "മലയാളം", speechLang: "ml-IN", ttsCode: "ml" },
];

const COPY: Record<CookLangId, LangCopy> = {
  hi: {
    greeting: "नमस्ते",
    thanks: "धन्यवाद",
    recipeToday: (n) => `आज ${n} बनानी है`,
    mainIng: (c) => `मुख्य सामग्री ${c} है`,
    takesMinutes: (m) => `लगभग ${m} मिनट लगेंगे`,
    stepsInMessage: (n) => `कुल ${n} स्टेप हैं, पूरी रेसिपी WhatsApp मैसेज में है`,
    serveWith: (p) => `साथ में ${p} परोसें`,
    watchYt: (n) => `YouTube पर ${n} वीडियो भी देख सकते हैं`,
    menuListen: "आज का मेन्यू सुनिए",
    breakfast: (n, c, m) => `नाश्ते में ${n}, मुख्य ${c}, ${m} मिनट`,
    lunch: (n, c, m) => `दोपहर में ${n}, मुख्य ${c}, ${m} मिनट`,
    dinner: (n, c, m) => `रात के खाने में ${n}, मुख्य ${c}, ${m} मिनट`,
    ytLinksBelow: "YouTube वीडियो के लिंक WhatsApp मैसेज में हैं",
    waRecipeGreeting: (n) => `नमस्ते! आज *${n}* बनानी है।`,
    waMinutesMain: (m, c) => `⏱ ${m} मिनट | मुख्य सामग्री: ${c}`,
    waRecipeHint: "पूरा तरीका: ऊपर steps देखें, YouTube वीडियो खोलें, या voice note सुनवाएँ।",
    waPlanGreeting: "नमस्ते! आज का मेन्यू:",
    waMealLine: (label, n, m, c) => `${label}: ${n} (${m} मिनट) — मुख्य: ${c}`,
    mealBreakfast: "नाश्ता",
    mealLunch: "दोपहर",
    mealDinner: "रात",
    waYtHint: "▶️ YouTube वीडियो — लिंक ऊपर देखें",
    minutesUnit: "मिनट",
  },
  kn: {
    greeting: "ನಮಸ್ಕಾರ",
    thanks: "ಧನ್ಯವಾದಗಳು",
    recipeToday: (n) => `ಇಂದು ${n} ಮಾಡಬೇಕು`,
    mainIng: (c) => `ಮುಖ್ಯ ಪದಾರ್ಥ ${c}`,
    takesMinutes: (m) => `ಸುಮಾರು ${m} ನಿಮಿಷ ಬೇಕು`,
    stepsInMessage: (n) => `${n} ಹಂತಗಳಿವೆ, ಪೂರ್ಣ ವಿಧಾನ WhatsApp ಸಂದೇಶದಲ್ಲಿದೆ`,
    serveWith: (p) => `ಜೊತೆಗೆ ${p} ಬಡಿಸಿ`,
    watchYt: (n) => `YouTube ನಲ್ಲಿ ${n} ವೀಡಿಯೊ ನೋಡಬಹುದು`,
    menuListen: "ಇಂದಿನ ಮೆನು ಕೇಳಿ",
    breakfast: (n, c, m) => `ಬೆಳಗಿನ ಉಪಾಹಾರ ${n}, ಮುಖ್ಯ ${c}, ${m} ನಿಮಿಷ`,
    lunch: (n, c, m) => `ಮಧ್ಯಾಹ್ನ ${n}, ಮುಖ್ಯ ${c}, ${m} ನಿಮಿಷ`,
    dinner: (n, c, m) => `ರಾತ್ರಿ ${n}, ಮುಖ್ಯ ${c}, ${m} ನಿಮಿಷ`,
    ytLinksBelow: "YouTube ಲಿಂಕ್‌ಗಳು WhatsApp ಸಂದೇಶದಲ್ಲಿವೆ",
    waRecipeGreeting: (n) => `ನಮಸ್ಕಾರ! ಇಂದು *${n}* ಮಾಡಬೇಕು.`,
    waMinutesMain: (m, c) => `⏱ ${m} ನಿಮಿಷ | ಮುಖ್ಯ: ${c}`,
    waRecipeHint: "ಪೂರ್ಣ ವಿಧಾನ: ಮೇಲೆ steps, YouTube, ಅಥವಾ voice note ಬಳಸಿ.",
    waPlanGreeting: "ನಮಸ್ಕಾರ! ಇಂದಿನ ಮೆನು:",
    waMealLine: (label, n, m, c) => `${label}: ${n} (${m} ನಿಮಿಷ) — ಮುಖ್ಯ: ${c}`,
    mealBreakfast: "ಬೆಳಗಿನ",
    mealLunch: "ಮಧ್ಯಾಹ್ನ",
    mealDinner: "ರಾತ್ರಿ",
    waYtHint: "▶️ YouTube — ಲಿಂಕ್ ಮೇಲೆ",
    minutesUnit: "ನಿಮಿಷ",
  },
  bn: {
    greeting: "নমস্কার",
    thanks: "ধন্যবাদ",
    recipeToday: (n) => `আজ ${n} বানাতে হবে`,
    mainIng: (c) => `মূল উপকরণ ${c}`,
    takesMinutes: (m) => `প্রায় ${m} মিনিট লাগবে`,
    stepsInMessage: (n) => `${n} ধাপ আছে, পুরো রেসিপি WhatsApp মেসেজে`,
    serveWith: (p) => `সাথে ${p} পরিবেশন করুন`,
    watchYt: (n) => `YouTube-এ ${n} ভিডিও দেখতে পারেন`,
    menuListen: "আজকের মেনু শুনুন",
    breakfast: (n, c, m) => `সকালে ${n}, মূল ${c}, ${m} মিনিট`,
    lunch: (n, c, m) => `দুপুরে ${n}, মূল ${c}, ${m} মিনিট`,
    dinner: (n, c, m) => `রাতে ${n}, মূল ${c}, ${m} মিনিট`,
    ytLinksBelow: "YouTube লিংক WhatsApp মেসেজে আছে",
    waRecipeGreeting: (n) => `নমস্কার! আজ *${n}* বানাতে হবে।`,
    waMinutesMain: (m, c) => `⏱ ${m} মিনিট | মূল: ${c}`,
    waRecipeHint: "পুরো পদ্ধতি: উপরে steps, YouTube, বা voice note শুনান।",
    waPlanGreeting: "নমস্কার! আজকের মেনু:",
    waMealLine: (label, n, m, c) => `${label}: ${n} (${m} মিনিট) — মূল: ${c}`,
    mealBreakfast: "নাশতা",
    mealLunch: "দুপুর",
    mealDinner: "রাত",
    waYtHint: "▶️ YouTube — লিংক উপরে",
    minutesUnit: "মিনিট",
  },
  te: {
    greeting: "నమస్కారం",
    thanks: "ధన్యవాదాలు",
    recipeToday: (n) => `ఈరోజు ${n} చేయాలి`,
    mainIng: (c) => `ప్రధాన పదార్థం ${c}`,
    takesMinutes: (m) => `సుమారు ${m} నిమిషాలు పడుతుంది`,
    stepsInMessage: (n) => `${n} దశలు ఉన్నాయి, పూర్తి recipe WhatsApp మెసేజ్‌లో`,
    serveWith: (p) => `తో ${p} వడతాం`,
    watchYt: (n) => `YouTube లో ${n} వీడియో చూడండి`,
    menuListen: "ఈరోజు మెను వినండి",
    breakfast: (n, c, m) => `అల్పాహారం ${n}, ప్రధాన ${c}, ${m} నిమిషాలు`,
    lunch: (n, c, m) => `మధ్యాహ్నం ${n}, ప్రధాన ${c}, ${m} నిమిషాలు`,
    dinner: (n, c, m) => `రాత్రి ${n}, ప్రధాన ${c}, ${m} నిమిషాలు`,
    ytLinksBelow: "YouTube లింక్‌లు WhatsApp మెసేజ్‌లో ఉన్నాయి",
    waRecipeGreeting: (n) => `నమస్కారం! ఈరోజు *${n}* చేయాలి.`,
    waMinutesMain: (m, c) => `⏱ ${m} నిమిషాలు | ప్రధాన: ${c}`,
    waRecipeHint: "పూర్తి విధానం: పై steps, YouTube, లేదా voice note వినిపించండి.",
    waPlanGreeting: "నమస్కారం! ఈరోజు మెను:",
    waMealLine: (label, n, m, c) => `${label}: ${n} (${m} నిమిషాలు) — ప్రధాన: ${c}`,
    mealBreakfast: "అల్పాహారం",
    mealLunch: "మధ్యాహ్నం",
    mealDinner: "రాత్రి",
    waYtHint: "▶️ YouTube — లింక్ పైన",
    minutesUnit: "నిమిషాలు",
  },
  ta: {
    greeting: "வணக்கம்",
    thanks: "நன்றி",
    recipeToday: (n) => `இன்று ${n} செய்ய வேண்டும்`,
    mainIng: (c) => `முக்கிய பொருள் ${c}`,
    takesMinutes: (m) => `சுமார் ${m} நிமிடம் ஆகும்`,
    stepsInMessage: (n) => `${n} படிகள் உள்ளன, முழு recipe WhatsApp செய்தியில்`,
    serveWith: (p) => `உடன் ${p} பரிமாறுங்கள்`,
    watchYt: (n) => `YouTube-ல் ${n} வீடியோ பார்க்கலாம்`,
    menuListen: "இன்றைய மெனு கேளுங்கள்",
    breakfast: (n, c, m) => `காலை ${n}, முக்கிய ${c}, ${m} நிமிடம்`,
    lunch: (n, c, m) => `மதியம் ${n}, முக்கிய ${c}, ${m} நிமிடம்`,
    dinner: (n, c, m) => `இரவு ${n}, முக்கிய ${c}, ${m} நிமிடம்`,
    ytLinksBelow: "YouTube இணைப்புகள் WhatsApp செய்தியில் உள்ளன",
    waRecipeGreeting: (n) => `வணக்கம்! இன்று *${n}* செய்ய வேண்டும்.`,
    waMinutesMain: (m, c) => `⏱ ${m} நிமிடம் | முக்கிய: ${c}`,
    waRecipeHint: "முழு முறை: மேலே steps, YouTube, அல்லது voice note கேட்கவும்.",
    waPlanGreeting: "வணக்கம்! இன்றைய மெனு:",
    waMealLine: (label, n, m, c) => `${label}: ${n} (${m} நிமிடம்) — முக்கிய: ${c}`,
    mealBreakfast: "காலை",
    mealLunch: "மதியம்",
    mealDinner: "இரவு",
    waYtHint: "▶️ YouTube — இணைப்பு மேலே",
    minutesUnit: "நிமிடம்",
  },
  mr: {
    greeting: "नमस्कार",
    thanks: "धन्यवाद",
    recipeToday: (n) => `आज ${n} बनवायचे आहे`,
    mainIng: (c) => `मुख्य साहित्य ${c}`,
    takesMinutes: (m) => `साधारण ${m} मिनिटे लागतील`,
    stepsInMessage: (n) => `${n} पाऊले आहेत, संपूर्ण recipe WhatsApp मेसेजमध्ये`,
    serveWith: (p) => `सोबत ${p} सर्व्ह करा`,
    watchYt: (n) => `YouTube वर ${n} व्हिडिओ पाहू शकता`,
    menuListen: "आजचे मेनू ऐका",
    breakfast: (n, c, m) => `नाश्त्यात ${n}, मुख्य ${c}, ${m} मिनिटे`,
    lunch: (n, c, m) => `दुपारी ${n}, मुख्य ${c}, ${m} मिनिटे`,
    dinner: (n, c, m) => `रात्री ${n}, मुख्य ${c}, ${m} मिनिटे`,
    ytLinksBelow: "YouTube लिंक WhatsApp मेसेजमध्ये आहेत",
    waRecipeGreeting: (n) => `नमस्कार! आज *${n}* बनवायचे.`,
    waMinutesMain: (m, c) => `⏱ ${m} मिनिटे | मुख्य: ${c}`,
    waRecipeHint: "संपूर्ण पद्धत: वर steps, YouTube, किंवा voice note ऐका.",
    waPlanGreeting: "नमस्कार! आजचे मेनू:",
    waMealLine: (label, n, m, c) => `${label}: ${n} (${m} मिनिटे) — मुख्य: ${c}`,
    mealBreakfast: "नाश्ता",
    mealLunch: "दुपार",
    mealDinner: "रात्र",
    waYtHint: "▶️ YouTube — लिंक वर",
    minutesUnit: "मिनिटे",
  },
  gu: {
    greeting: "નમસ્તે",
    thanks: "આભાર",
    recipeToday: (n) => `આજે ${n} બનાવવું છે`,
    mainIng: (c) => `મુખ્ય સામગ્રી ${c}`,
    takesMinutes: (m) => `લગભગ ${m} મિનિટ લાગશે`,
    stepsInMessage: (n) => `${n} પગલાં છે, સંપૂર્ણ recipe WhatsApp મેસેજમાં`,
    serveWith: (p) => `સાથે ${p} પીરસો`,
    watchYt: (n) => `YouTube પર ${n} વીડિયો જોઈ શકો`,
    menuListen: "આજનું મેનુ સાંભળો",
    breakfast: (n, c, m) => `નાસ્તામાં ${n}, મુખ્ય ${c}, ${m} મિનિટ`,
    lunch: (n, c, m) => `બપોરે ${n}, મુખ્ય ${c}, ${m} મિનિટ`,
    dinner: (n, c, m) => `રાત્રે ${n}, મુખ્ય ${c}, ${m} મિનિટ`,
    ytLinksBelow: "YouTube લિંક WhatsApp મેસેજમાં છે",
    waRecipeGreeting: (n) => `નમસ્તે! આજે *${n}* બનાવવું.`,
    waMinutesMain: (m, c) => `⏱ ${m} મિનિટ | મુખ્ય: ${c}`,
    waRecipeHint: "સંપૂર્ણ રીત: ઉપર steps, YouTube, અથવા voice note સાંભળાવો.",
    waPlanGreeting: "નમસ્તે! આજનું મેનુ:",
    waMealLine: (label, n, m, c) => `${label}: ${n} (${m} મિનિટ) — મુખ્ય: ${c}`,
    mealBreakfast: "નાસ્તો",
    mealLunch: "બપોર",
    mealDinner: "રાત્ર",
    waYtHint: "▶️ YouTube — લિંક ઉપર",
    minutesUnit: "મિનિટ",
  },
  ml: {
    greeting: "നമസ്കാരം",
    thanks: "നന്ദി",
    recipeToday: (n) => `ഇന്ന് ${n} ഉണ്ടാക്കണം`,
    mainIng: (c) => `പ്രധാന ചേരുവ ${c}`,
    takesMinutes: (m) => `ഏകദേശം ${m} മിനിറ്റ് വേണം`,
    stepsInMessage: (n) => `${n} ഘട്ടങ്ങൾ ഉണ്ട്, പൂർണ്ണ recipe WhatsApp സന്ദേശത്തിൽ`,
    serveWith: (p) => `കൂടെ ${p} വിളംബുക`,
    watchYt: (n) => `YouTube-ൽ ${n} വീഡിയോ കാണാം`,
    menuListen: "ഇന്നത്തെ മെനു കേൾക്കൂ",
    breakfast: (n, c, m) => `പ്രഭാതം ${n}, പ്രധാന ${c}, ${m} മിനിറ്റ്`,
    lunch: (n, c, m) => `ഉച്ച ${n}, പ്രധാന ${c}, ${m} മിനിറ്റ്`,
    dinner: (n, c, m) => `രാത്രി ${n}, പ്രധാന ${c}, ${m} മിനിറ്റ്`,
    ytLinksBelow: "YouTube ലിങ്കുകൾ WhatsApp സന്ദേശത്തിൽ",
    waRecipeGreeting: (n) => `നമസ്കാരം! ഇന്ന് *${n}* ഉണ്ടാക്കണം.`,
    waMinutesMain: (m, c) => `⏱ ${m} മിനിറ്റ് | പ്രധാന: ${c}`,
    waRecipeHint: "പൂർണ്ണ രീതി: മുകളിൽ steps, YouTube, അല്ലെങ്കിൽ voice note കേൾപ്പിക്കൂ.",
    waPlanGreeting: "നമസ്കാരം! ഇന്നത്തെ മെനു:",
    waMealLine: (label, n, m, c) => `${label}: ${n} (${m} മിനിറ്റ്) — പ്രധാന: ${c}`,
    mealBreakfast: "പ്രഭാതം",
    mealLunch: "ഉച്ച",
    mealDinner: "രാത്രി",
    waYtHint: "▶️ YouTube — ലിങ്ക് മുകളിൽ",
    minutesUnit: "മിനിറ്റ്",
  },
};

function recipeMinutes(time: string): string {
  return time.match(/\d+/)?.[0] ?? "20";
}

function langMeta(id: CookLangId): CookLanguage {
  return COOK_LANGUAGES.find((l) => l.id === id)!;
}

export function formatRecipeSpeech(r: CookRecipe, langId: CookLangId): string {
  const t = COPY[langId];
  const mins = recipeMinutes(r.time);
  const stepCount = r.steps?.length ?? 0;
  let text = `${t.greeting}। ${t.recipeToday(r.name)}। ${t.mainIng(r.core)}। ${t.takesMinutes(mins)}।`;
  if (stepCount > 0) text += ` ${t.stepsInMessage(stepCount)}।`;
  if (r.pairing) text += ` ${t.serveWith(r.pairing)}।`;
  text += ` ${t.watchYt(r.name)}। ${t.thanks}।`;
  return text;
}

export function formatPlanDaySpeech(day: CookPlanDay, langId: CookLangId): string {
  const t = COPY[langId];
  let text = `${t.greeting}। ${t.menuListen} `;
  if (day.breakfast) text += `${t.breakfast(day.breakfast.name, day.breakfast.core, recipeMinutes(day.breakfast.time))}। `;
  if (day.lunch) text += `${t.lunch(day.lunch.name, day.lunch.core, recipeMinutes(day.lunch.time))}। `;
  if (day.dinner) text += `${t.dinner(day.dinner.name, day.dinner.core, recipeMinutes(day.dinner.time))}। `;
  text += `${t.ytLinksBelow} ${t.thanks}।`;
  return text;
}

export function formatRecipeWA(r: CookRecipe, langId: CookLangId): string {
  const t = COPY[langId];
  const meta = langMeta(langId);
  const mins = recipeMinutes(r.time);
  let block = `\n\n*${meta.native}:*\n`;
  block += `${t.waRecipeGreeting(r.name)}\n`;
  block += `${t.waMinutesMain(mins, r.core)}\n`;
  block += `${t.waRecipeHint}\n`;
  if (r.pairing) block += `🍽 ${t.serveWith(r.pairing)}\n`;
  return block;
}

export function formatPlanDayWA(day: CookPlanDay, langId: CookLangId): string {
  const t = COPY[langId];
  const meta = langMeta(langId);
  let block = `\n\n*${meta.native}:*\n${t.waPlanGreeting}\n\n`;
  if (day.breakfast) {
    block += `🌅 ${t.waMealLine(t.mealBreakfast, day.breakfast.name, recipeMinutes(day.breakfast.time), day.breakfast.core)}\n`;
  }
  if (day.lunch) {
    block += `☀️ ${t.waMealLine(t.mealLunch, day.lunch.name, recipeMinutes(day.lunch.time), day.lunch.core)}\n`;
  }
  if (day.dinner) {
    block += `🌙 ${t.waMealLine(t.mealDinner, day.dinner.name, recipeMinutes(day.dinner.time), day.dinner.core)}\n`;
  }
  block += `\n${t.waYtHint}`;
  return block;
}

export function formatAllLanguagesRecipeWA(r: CookRecipe): string {
  return COOK_LANGUAGES.map((l) => formatRecipeWA(r, l.id)).join("");
}

export function formatAllLanguagesPlanDayWA(day: CookPlanDay): string {
  return COOK_LANGUAGES.map((l) => formatPlanDayWA(day, l.id)).join("");
}

export function speakCookLanguage(text: string, langId: CookLangId, onDone?: () => void): boolean {
  if (typeof window === "undefined" || !window.speechSynthesis) return false;
  const meta = langMeta(langId);
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = meta.speechLang;
  utterance.rate = 0.9;
  const voice = window.speechSynthesis.getVoices().find((v) => v.lang.startsWith(meta.ttsCode));
  if (voice) utterance.voice = voice;
  if (onDone) {
    utterance.onend = () => onDone();
    utterance.onerror = () => onDone();
  }
  window.speechSynthesis.speak(utterance);
  return true;
}

export async function downloadOrShareCookVoice(
  text: string,
  langId: CookLangId,
  filename = "cook-voice.mp3",
): Promise<"shared" | "downloaded" | "played"> {
  const meta = langMeta(langId);
  const ttsUrl = `https://translate.googleapis.com/translate_tts?ie=UTF-8&client=gtx&tl=${meta.ttsCode}&q=${encodeURIComponent(text)}`;
  try {
    const res = await fetch(ttsUrl);
    if (!res.ok) throw new Error("tts fetch failed");
    const blob = await res.blob();
    const file = new File([blob], filename, { type: blob.type || "audio/mpeg" });
    if (typeof navigator !== "undefined" && navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: `Cook instructions (${meta.label})` });
      return "shared";
    }
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
    return "downloaded";
  } catch {
    speakCookLanguage(text, langId);
    return "played";
  }
}

/* Backward-compatible aliases */
export type HindiCookRecipe = CookRecipe;
export type HindiPlanDay = CookPlanDay;
export const formatRecipeHindiSpeech = (r: CookRecipe) => formatRecipeSpeech(r, "hi");
export const formatPlanDayHindiSpeech = (day: CookPlanDay) => formatPlanDaySpeech(day, "hi");
export const formatRecipeHindiWA = (r: CookRecipe) => formatRecipeWA(r, "hi");
export const formatPlanDayHindiWA = (day: CookPlanDay) => formatPlanDayWA(day, "hi");
export const speakHindi = (text: string, onDone?: () => void) => speakCookLanguage(text, "hi", onDone);
export const downloadOrShareHindiVoice = (text: string, filename?: string) =>
  downloadOrShareCookVoice(text, "hi", filename);
