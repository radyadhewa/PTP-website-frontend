export const SAMPLE_PASSAGES = [
  {
    text: "Technology has revolutionized the way we communicate, transforming simple text messages into rich multimedia conversations. The evolution from traditional mail to instant messaging represents one of humanity's most significant leaps in connectivity. Today, billions of people stay connected across continents, sharing ideas and building relationships that would have been impossible mere decades ago.",
    genre: 'Science & Technology',
    difficulty: 'Intermediate',
    length: 'medium',
  },
  {
    text: "The ocean covers more than 70% of Earth's surface, yet we know less about it than we do about the surface of the moon. Marine life exhibits incredible diversity, with millions of species adapted to various depths and conditions. From bioluminescent creatures in the abyssal zone to magnificent coral ecosystems in shallow reefs, the ocean remains one of our planet's greatest frontiers.",
    genre: 'Nature & Environment',
    difficulty: 'Intermediate',
    length: 'medium',
  },
  {
    text: "Reading is a fundamental skill that opens doors to knowledge and imagination. When we read, our brains engage in a complex process of decoding symbols and constructing meaning. This mental exercise strengthens neural connections, improves focus, and expands our understanding of the world around us.",
    genre: 'Self-Improvement',
    difficulty: 'Beginner',
    length: 'short',
  },
  {
    text: "Climate change is one of the most pressing challenges of our time. Rising global temperatures affect weather patterns, sea levels, and ecosystems worldwide. Scientists agree that human activities, particularly the emission of greenhouse gases, are the primary cause of observed warming since the mid-20th century.",
    genre: 'Nature & Environment',
    difficulty: 'Advanced',
    length: 'medium',
  },
  {
    text: "Artificial intelligence has transformed industries and daily life in remarkable ways. Machine learning algorithms power recommendation systems, autonomous vehicles, and medical diagnostics. As AI continues to evolve, questions about ethics, privacy, and human-AI collaboration become increasingly important.",
    genre: 'Science & Technology',
    difficulty: 'Advanced',
    length: 'long',
  },
  {
    text: "The ancient philosophers of Greece laid the foundation for Western thought. Figures like Socrates, Plato, and Aristotle revolutionized how we understand knowledge, truth, and human existence. Their contributions continue to shape education, science, and philosophy more than two thousand years later.",
    genre: 'History & Culture',
    difficulty: 'Intermediate',
    length: 'medium',
  },
  {
    text: "Exercise is one of the most effective ways to improve both physical and mental health. Regular physical activity strengthens the heart, improves circulation, and boosts the production of endorphins-the body's natural mood elevators. Just 30 minutes of moderate exercise daily can significantly enhance your overall wellbeing.",
    genre: 'Health & Wellness',
    difficulty: 'Beginner',
    length: 'short',
  },
  {
    text: "The psychology of habit formation reveals that our behaviors are often shaped by subtle environmental cues and reward systems. Understanding the habit loop-cue, routine, and reward-empowers us to build positive habits and break negative ones. This knowledge has revolutionized personal development and behavior change strategies.",
    genre: 'Self-Improvement',
    difficulty: 'Intermediate',
    length: 'medium',
  },
];

export function filterPassagesByPreferences(preferences) {
  if (!preferences) {
    return SAMPLE_PASSAGES;
  }

  const filtered = SAMPLE_PASSAGES.filter((passage) => {
    const genreMatch = preferences.genres.includes(passage.genre);
    const difficultyMatch = passage.difficulty === preferences.difficulty;
    const lengthMatch = passage.length === preferences.passageLength;

    return genreMatch && difficultyMatch && lengthMatch;
  });

  if (filtered.length > 0) {
    return filtered;
  }

  const partialFiltered = SAMPLE_PASSAGES.filter((passage) => {
    const genreMatch = preferences.genres.includes(passage.genre);
    const difficultyMatch = passage.difficulty === preferences.difficulty;
    return genreMatch && difficultyMatch;
  });

  return partialFiltered.length > 0 ? partialFiltered : SAMPLE_PASSAGES;
}