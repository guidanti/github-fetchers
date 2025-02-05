import { Operation } from "effection";
import z from "npm:zod@3.24.1";
import { TestContainer } from "./types.ts";

const AccessKey = z.object({
  status: z.literal("success"),
  accessKey: z.string(),
  secretKey: z.string(),
});

export function* createAccessKey(
  minio: TestContainer,
  { username, password, host }: {
    username: string;
    password: string;
    host: string;
  },
): Operation<z.infer<typeof AccessKey>> {
  yield* minio.exec(
    `mc config host add ${host} http://localhost:9000 ${username} ${password}`,
  );

  const { stdout } = yield* minio.exec(
    `mc admin accesskey create ${host} --json`,
  );

  return AccessKey.parse(JSON.parse(stdout));
}

export function* createBucket(
  minio: TestContainer,
  { host, bucket }: { host: string; bucket: string },
): Operation<void> {
  yield* minio.exec(
    `mc mb ${host}/${bucket}`,
  );
}
