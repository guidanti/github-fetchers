import { parse } from "jsr:@std/yaml@1.0.5";
import { assert } from "jsr:@std/assert";
import {
  main,
  call,
  createQueue,
  spawn,
  Operation,
  Subscription,
  each,
} from "npm:effection@4.0.0-alpha.5";
import { App } from "npm:octokit@4.1.0";
import { fetchGithubScanReports } from './fetchGithubScanReports.ts';

interface GitHubApp {
  appId: number;
  privateKey: string;
  [key: string]: unknown;
}

if (import.meta.main) {
  await main(function* () {
    const location = new URL(`../../github-app.yaml`, import.meta.url);
    const githubApp = parse(
      yield* call(() => Deno.readTextFile(location))
    ) as GitHubApp;

    assert(
      githubApp.appId,
      "Your github app credentials yaml file is missing appId"
    );

    assert(
      githubApp.privateKey,
      "Your github app credentials yaml file is missing privateKey"
    );

    const app = new App({
      appId: githubApp.appId,
      privateKey: githubApp.privateKey,
    });

    const results = createQueue<any, void>(); // 🚨

    yield* spawn(function* () {
      yield* fetchGithubScanReports({
        app,
        results,
        logger: console,
      });
      results.close();
    });

    // deno-lint-ignore require-yield
    function* createResultsSubscription(): Operation<
      Subscription<any, void> // 🚨
    > {
      return results;
    }

    for (
      const result of yield* each(
        createResultsSubscription(),
      )
    ) {
      console.log(result);
      yield* each.next();
    }
  });
}
