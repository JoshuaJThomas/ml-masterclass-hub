import { createEmptyCard, fsrs, generatorParameters, Rating } from 'ts-fsrs';

const engine = fsrs(generatorParameters({ enable_fuzz: false }));

export { Rating };

export function newCard(now = new Date()) {
  return createEmptyCard(now);
}

// ts-fsrs cards have Date fields; after JSON storage they are ISO strings. Revive them.
export function reviveCard(card) {
  return {
    ...card,
    due: new Date(card.due),
    last_review: card.last_review ? new Date(card.last_review) : undefined,
  };
}

export function grade(card, rating, now = new Date()) {
  return engine.next(reviveCard(card), now, rating).card;
}

export function isDue(card, now = new Date()) {
  return new Date(card.due) <= now;
}

// Map a practice outcome to an FSRS rating.
export function ratingFor({ passed, usedHelp }) {
  if (!passed) return Rating.Again;
  return usedHelp ? Rating.Hard : Rating.Good;
}
