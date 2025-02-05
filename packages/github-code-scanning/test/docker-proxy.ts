import { all, each, resource, spawn, stream } from "effection";
import * as io from "jsr:@std/io@0.225";
import "./promise.ts";

export function startDockerProxy(port: number = 0) {
  return resource<Deno.TcpListener>(function* (provide) {
    // Disable RYUK because it fails
    Deno.env.set("TESTCONTAINERS_RYUK_DISABLED", "true");

    const tcpListener = Deno.listen({ port });

    const proxy =
      `${tcpListener.addr.transport}://${tcpListener.addr.hostname}:${tcpListener.addr.port}`;

    console.log(`Stared proxy on ${proxy}`);

    Deno.env.set("DOCKER_HOST", proxy);

    yield* spawn(function* () {
      for (const tcpConn of yield* each(stream(tcpListener))) {
        const tcpConnUrl =
          `${tcpConn.remoteAddr.transport}://${tcpConn.remoteAddr.hostname}:${tcpConn.remoteAddr.port}`;

        console.log(`started ${tcpConnUrl}`);
        yield* spawn(function* () {
          let unixConn: Deno.UnixConn | undefined;
          try {
            unixConn = yield* Deno.connect({
              transport: "unix",
              path: "/var/run/docker.sock",
            });

            yield* all([
              io.copy(tcpConn, unixConn),
              io.copy(unixConn, tcpConn),
            ]);
          } catch (error) {
            console.error(
              `[${tcpConnUrl}] Error handling connection: ${error}`,
            );
          } finally {
            console.log("Closed the connection");
            tcpConn.close();
            unixConn?.close();
          }
        });
        yield* each.next();
      }
    });

    try {
      console.log(`Proxy running on ${Deno.env.get("DOCKER_HOST")}`);
      yield* provide(tcpListener);
    } finally {
      console.log("closing tcp listener");
      tcpListener.close();
      Deno.env.delete("DOCKER_HOST");
    }
  });
}
