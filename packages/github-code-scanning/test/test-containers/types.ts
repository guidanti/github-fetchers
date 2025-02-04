import { type Operation } from "effection";

export type FileToCopy = {
  source: string;
  target: string;
  mode?: number;
};

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
} | {
  type: "copy";
  container: keyof typeof registry;
  files?: FileToCopy[];
  directories?: FileToCopy[];
} | {
  type: "getPorts";
  container: keyof typeof registry;
} | {
  type: "getHost";
  container: keyof typeof registry;
};

export type WorkerRecv = {
  type: "started";
  container: keyof typeof registry;
  connectionUrl: string;
} | {
  type: "ports";
  container: keyof typeof registry;
  api: number;
  ui: number;
} | {
  type: "host";
  container: keyof typeof registry;
  host: string
}

export interface TestContainer {
  connectionUrl: string;
  stop(): Operation<void>;
  copy(options: { files?: FileToCopy[], directories?: FileToCopy[] }): Operation<void>;
  getPorts(): Operation<{api: number, ui: number}>
  getHost(): Operation<string>
}

export interface TestContainers {
  startMinio(options?: { username?: string; password?: string; }): Operation<TestContainer>
}