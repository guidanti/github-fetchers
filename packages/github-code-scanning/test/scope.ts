import { type Operation, run } from "effection";

export interface TestScope {
  /**
   * Call from your runner's "beforeEach" or equivalent
   */
  addSetup(op: () => Operation<void>): void;

  /**
   * Call from runner's `it()` or equivalent;
   */
  runTest(op: () => Operation<void>): Promise<void>;
}

export function createTestScope(): TestScope {
  const setup = [] as Array<() => Operation<void>>;

  return {
    addSetup(op) {
      setup.push(op);
    },

    runTest(op) {
      return run(function* () {
        for (const step of setup) {
          yield* step();
        }
        yield* op();
      });
    },
  };
}
