export type EvaluationMode = 'strict' | 'flexible';

/**
 * Checks if user input matches correct answer, considering evaluation mode.
 * - Strict mode: Exact trimmed lower-case match.
 * - Flexible mode:
 *   - Ignores diacritics, tone accents, punctuation, extra spaces, casing.
 *   - Handles multiple answers split by / , ; or |
 *   - Word matching: if user's input matches any keyword/phrase in correct answer or vice-versa.
 */
export function evaluateAnswer(
  userInput: string,
  correctAnswer: string,
  mode: EvaluationMode = 'flexible',
  extraContext?: { term?: string; pinyin?: string; definition?: string; synonyms?: string }
): boolean {
  if (!userInput) return false;

  const cleanUser = userInput.trim();
  const cleanCorrect = correctAnswer.trim();

  if (!cleanUser || !cleanCorrect) return false;

  // Exact match first (fast path)
  if (cleanUser.toLowerCase() === cleanCorrect.toLowerCase()) {
    return true;
  }

  if (mode === 'strict') {
    return cleanUser.toLowerCase() === cleanCorrect.toLowerCase();
  }

  // Flexible evaluation:
  const sanitize = (str: string) => {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // strip tone marks / diacritics
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'<>【】（）！，。？：；—\\]/g, ' ') // strip punctuation
      .replace(/\s+/g, ' ')
      .trim();
  };

  const normUser = sanitize(cleanUser);
  const normCorrect = sanitize(cleanCorrect);

  if (!normUser) return false;
  if (normUser === normCorrect) return true;

  // Gather all valid variations
  const targets = [
    cleanCorrect,
    ...(extraContext ? [extraContext.term, extraContext.pinyin, extraContext.definition, extraContext.synonyms] : [])
  ].filter(Boolean) as string[];

  const allTokens: string[] = [];
  for (const t of targets) {
    const parts = t.split(/[/,;;\n|]/);
    for (const p of parts) {
      if (p.trim()) {
        allTokens.push(p.trim());
      }
    }
  }

  for (const token of allTokens) {
    const normToken = sanitize(token);
    if (normToken && normUser === normToken) {
      return true;
    }
  }

  // Check word-by-word / partial keyword match
  const userWords = normUser.split(' ').filter((w) => w.length > 0);
  const correctWords = normCorrect.split(' ').filter((w) => w.length > 0);

  // If any word in user input is in correct words list or matches a target token
  for (const uWord of userWords) {
    if (correctWords.includes(uWord)) return true;
    for (const token of allTokens) {
      const normToken = sanitize(token);
      if (normToken.split(' ').includes(uWord)) return true;
    }
    // Chinese characters or 2+ letter words match
    if (uWord.length >= 2 && normCorrect.includes(uWord)) return true;
  }

  for (const cWord of correctWords) {
    if (cWord.length >= 2 && normUser.includes(cWord)) return true;
  }

  return false;
}
