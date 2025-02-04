import { workerMain } from "jsr:@effection-contrib/worker@0.1.0";
import { registry, WorkerSend } from "./types.ts";
import "../promise.ts";
import { type StartedTestContainer } from "testcontainers";
import { all } from "effection";
import { type StartedMinioContainer } from "@testcontainers/minio";

await workerMain<WorkerSend, unknown, unknown, unknown>(
  function* ({ messages }) {
    const containers = new Map<string, StartedTestContainer>();

    yield* messages.forEach(function* (message) {
      console.log(message);
      switch (message.type) {
        case "start": {
          if (message.container === "minio") {
            const { MinioContainer } = yield* import("@testcontainers/minio");
            const container = new MinioContainer(registry[message.container]);
            if (message.password) container.withPassword(message.password);
            if (message.username) container.withUsername(message.username);
            const started = yield* container.start();
            containers.set(message.container, started);
            return {
              type: "started",
              connectionUrl: started.getConnectionUrl()
            }
          } else {
            throw new Error(`GenericContainer is not yet implemented`);
          }
        }
        case "stop": {
          const container = containers.get(message.container);
          if (!container) throw new Error(`Container was not found ${message.container}`);
          yield* container.stop();
          break;
        }
        case "copy": {
          const container = containers.get(message.container);
          if (!container) throw new Error(`Container was not found ${message.container}`);
          const ops = [];
          if (message.directories) {
            ops.push(container.copyDirectoriesToContainer(message.directories))
          }
          if (message.files) {
            ops.push(container.copyDirectoriesToContainer(message.files))
          }
          yield* all(ops);
          break;
        }
        case "getPorts": {
          if (message.container === "minio") {
            const container = containers.get(message.container) as StartedMinioContainer | undefined;
            if (!container) throw new Error(`Container was not found ${message.container}`);
            return {
              type: "ports",
              container: message.container,
              api: container.getPort(),
              ui: container.getUiPort(),
            }
          }
          break;
        }
        case "getHost": {
          const container = containers.get(message.container) as StartedMinioContainer | undefined;
          if (!container) throw new Error(`Container was not found ${message.container}`);
          return {
            type: "host",
            host: container.getHost()
          }
        }
        default: {
          // @ts-expect-error Property 'type' does not exist on type 'never'.deno-ts(2339)[]
          throw new Error(`${message.type} is not implemented in the worker`);
        }
          
      }
    });
  },
);
