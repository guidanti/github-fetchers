import { parse } from "jsr:@std/yaml@1.0.5";
import { assert } from "jsr:@std/assert";
import { main, call, stream, each } from "npm:effection@4.0.0-alpha.5";
import { App } from "npm:octokit@4.1.0";

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

    for (const { octokit, repository } of yield* each(
      stream(app.eachRepository.iterator())
    )) {
      const {
        default_branch,
        name: repo,
        owner: { login: owner },
      } = repository;

      const { data: { sha: commit } } = yield* call(() =>
        octokit.rest.repos.getCommit({
          owner,
          repo,
          ref: default_branch,
          per_page: 1,
        })
      );

      console.log(repo, commit);

      yield* each.next();
    }
  });
}
