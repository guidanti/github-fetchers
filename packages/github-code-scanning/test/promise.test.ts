import "./promise.ts";
import { describe, it } from "./bdd.ts";
import { expect } from "jsr:@std/expect@1";

describe("Extending Promise", () => {
  it("resolves a promise", function* () {
    const result = yield* Promise.resolve(5);

    expect(result).toBe(5);
  });
  it("rejects a promise", function* () {
    expect.assertions(1);
    try {
      yield* Promise.reject(new Error("failed"));
    } catch (e) {
      expect(e).toHaveProperty("message", "failed");
    }
  });
});
