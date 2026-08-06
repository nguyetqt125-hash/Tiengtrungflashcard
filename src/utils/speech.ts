export const speakChinese = (text: string, rate: number = 0.85) => {
  try {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis is not supported in this browser.');
      return;
    }

    window.speechSynthesis.cancel(); // Stop active speech

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = 1;

    const voices = window.speechSynthesis.getVoices();
    const chineseVoice = voices.find(
      (v) => v.lang.startsWith('zh') || v.lang.includes('CN') || v.lang.includes('TW')
    );

    if (chineseVoice) {
      utterance.voice = chineseVoice;
      utterance.lang = chineseVoice.lang;
    } else {
      utterance.lang = 'zh-CN';
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Speech synthesis error in frame context:', err);
  }
};
