import { beforeEach, describe, it } from "../test/bdd.ts";
import { expect } from "@std/expect";
import { useTestContainers } from "../test/test-containers/test-containers.ts";
import { createContext } from "effection";
import { TestContainer } from "../test/test-containers/types.ts";

const MinioContainerContext = createContext<TestContainer>("minio-container");

const useMinio = () => MinioContainerContext.expect();

describe("s3", () => {
  beforeEach(function*() {
    const testcontainers = yield* useTestContainers({ debug: true });
    
    const minio = yield* testcontainers.startMinio();

    yield* minio.copy({
      directories: [
        {
          source: (new URL('../minio-data', import.meta.url)).pathname,
          target: "/data"
        }
      ]
    });

    const ports = yield* minio.getPorts();
    const host = yield* minio.getHost();

    console.log({ host, ports });

    yield* MinioContainerContext.set(minio);
    console.log(minio.connectionUrl)

  });

  it('connects to container', function*() {
    expect.assertions(1);
    const minio = yield* useMinio();

    yield* minio.stop();
    expect(true).toBe(true);
  });
});

