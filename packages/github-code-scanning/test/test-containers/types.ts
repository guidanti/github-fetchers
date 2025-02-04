import { type Operation } from "effection";

export const registry = {
  minio: "minio/minio:RELEASE.2025-01-20T14-49-07Z"
} as const;

export type WorkerSend = {
  type: "start";
  container: keyof typeof registry;
  username?: string;
  password?: string;
} | {
  type: "stop";
  container: keyof typeof registry;
};

export type WorkerRecv = {
  type: "started";
  container: keyof typeof registry;
  connectionUrl: string;
}

export interface TestContainer {
  connectionUrl: string;
  stop(): Operation<void>
}

export interface TestContainers {
  startMinio(options?: { username?: string; password?: string; }): Operation<TestContainer>
}