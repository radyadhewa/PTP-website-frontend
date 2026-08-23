import { describe, expect, it } from 'vitest';
import { analyzeWord, parsePassageToTokens } from '@/lib/vocabulary';

describe('lib/vocabulary', () => {
  it('identifies technical glossary terms correctly', () => {
    const res = analyzeWord('photosynthesis');
    expect(res).not.toBeNull();
    expect(res?.pos).toBe('technical');
    expect(res?.isTechnical).toBe(true);
    expect(res?.definition).toContain('chemical process');
  });

  it('identifies parts of speech based on rules and word lists', () => {
    const adj = analyzeWord('ambient');
    expect(adj?.pos).toBe('adjective');

    const verb = analyzeWord('synthesize');
    expect(verb?.pos).toBe('verb');

    const adv = analyzeWord('efficiently');
    expect(adv?.pos).toBe('adverb');

    const noun = analyzeWord('hypothesis');
    expect(noun?.pos).toBe('noun');
  });

  it('parses passages into structured token streams', () => {
    const text = 'Photosynthesis is a crucial biological process.';
    const tokens = parsePassageToTokens(text);
    expect(tokens.length).toBeGreaterThan(0);

    const wordTokens = tokens.filter((t) => t.type === 'word');
    expect(wordTokens.length).toBeGreaterThan(0);
  });
});
