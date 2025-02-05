import { main } from "npm:effection@4.0.0-alpha.5";
import { S3ClientConfig } from "@aws-sdk/client-s3";
import { initS3Client } from "./lib/s3.ts";

// Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
if (import.meta.main) {
  await main(function* () {
    const tls = Deno.env.get("S3_USE_SSL") === "false" ? false : true;
    const endpoint = `${tls ? "https" : "http"}://${
      Deno.env.get("S3_ENDPOINT")
    }/`;

    const config: S3ClientConfig = {
      region: Deno.env.get("S3_REGION"),
      endpoint,
      forcePathStyle: Deno.env.get("S3_URL_STYLE") === "path",
      tls,
      credentials: {
        accessKeyId: Deno.env.get("S3_ACCESS_KEY_ID") ?? "",
        secretAccessKey: Deno.env.get("S3_SECRET_KEY") ?? "",
      },
    };

    yield* initS3Client(config);
  });
}
