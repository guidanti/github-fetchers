import { type S3ClientConfig } from "@aws-sdk/client-s3";
import { expect } from "@std/expect";
import { createContext } from "effection";

import { beforeAll, describe, it } from "../test/bdd.ts";
import {
  createAccessKey,
  createBucket,
} from "../test/test-containers/minio.ts";
import { useTestContainers } from "../test/test-containers/test-containers.ts";
import { TestContainer } from "../test/test-containers/types.ts";
import { getObject, initS3Client, putObject } from "./s3.ts";

const MinioContainerContext = createContext<TestContainer>("minio-container");

const useMinio = () => MinioContainerContext.expect();

function createS3Config(
  { endpoint, accessKeyId, secretAccessKey }: {
    endpoint: string;
    accessKeyId: string;
    secretAccessKey: string;
  },
): S3ClientConfig {
  const config: S3ClientConfig = {
    endpoint,
    forcePathStyle: true,
    region: "us-east-1",
    tls: false,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  };
  return config;
}

const username = "admin";
const password = "admin123";
const internal = "minio";
const bucket = "appsec";

function* setupS3Bucket(
  { username, password, internalhost, bucket }: {
    username: string;
    password: string;
    internalhost: string;
    bucket: string;
  },
) {
  const testcontainers = yield* useTestContainers({ debug: true });

  const minio = yield* testcontainers.startMinio({
    username,
    password,
  });

  const { accessKey, secretKey } = yield* createAccessKey(minio, {
    username,
    password,
    host: internalhost,
  });

  yield* createBucket(minio, { host: internalhost, bucket });

  const ports = yield* minio.getPorts();
  const host = yield* minio.getHost();

  const s3config = createS3Config({
    endpoint: `http://${host}:${ports.api}`,
    accessKeyId: accessKey,
    secretAccessKey: secretKey,
  });

  yield* initS3Client(s3config);

  yield* MinioContainerContext.set(minio);
}

describe("s3", () => {
  beforeAll(function* () {
    yield* setupS3Bucket({
      username,
      password,
      internalhost: internal,
      bucket,
    });
  });

  it("can put object into the storage", function* () {
    expect.assertions(1);
    const minio = yield* useMinio();

    yield* putObject({
      Body: "foo",
      Bucket: bucket,
      Key: "bar",
    });

    const result = yield* getObject({
      Bucket: bucket,
      Key: "bar",
    });

    expect(yield* result.Body!.transformToString()).toBe("foo");

    yield* minio.stop();
  });
});
