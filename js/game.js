// Game state. Pure logic, no DOM — easy to extend with timed or reverse modes.
import { colorDistance, randomRgb } from './color.js';
import { pointsFor, ratingFor, MAX_POINTS } from './scoring.js';

export class Game {
  constructor({ rounds = 5, format = 'hex', rng = Math.random } = {}) {
    this.format = format;
    this.rounds = Array.from({ length: rounds }, () => ({
      target: randomRgb(rng),
      guess: null,
      deltaE: null,
      points: null,
      rating: null,
    }));
    this.index = 0;
  }

  get current() {
    return this.rounds[this.index];
  }

  get roundNumber() {
    return this.index + 1;
  }

  get totalRounds() {
    return this.rounds.length;
  }

  get isLastRound() {
    return this.index === this.rounds.length - 1;
  }

  get score() {
    return this.rounds.reduce((sum, r) => sum + (r.points ?? 0), 0);
  }

  get maxScore() {
    return this.rounds.length * MAX_POINTS;
  }

  /** Lock in a guess for the current round and return the scored round. */
  submit(guessRgb) {
    const round = this.current;
    if (round.guess) return round;
    round.guess = { ...guessRgb };
    round.deltaE = colorDistance(round.target, round.guess);
    round.points = pointsFor(round.deltaE);
    round.rating = ratingFor(round.deltaE);
    return round;
  }

  /** Advance to the next round. Returns false when the game is over. */
  next() {
    if (this.isLastRound) return false;
    this.index += 1;
    return true;
  }
}
