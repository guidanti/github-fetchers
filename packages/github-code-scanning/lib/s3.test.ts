import { createContext, ensure, sleep } from "effection";
import { beforeAll, describe, it } from "../test/bdd.ts";
import { expect } from "@std/expect";
import { useTestContainers } from "../test/test-containers/test-containers.ts";

describe("s3", () => {
  beforeAll(function*() {
    const testcontainers = yield* useTestContainers();
    const minio = yield* testcontainers.startMinio();
    yield* minio.stop();

    console.log("finished after stop")
  });

  it('starts and stops container', function*() {
    expect.assertions(1);
    expect(true).toBe(true);
    console.log('finished assertion')
  });
});

