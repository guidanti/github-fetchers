import { parse } from "jsr:@std/yaml@1.0.5";
import { assert } from "jsr:@std/assert";
import { main, call, stream, each } from "npm:effection@4.0.0-alpha.5";
import { App, RequestError } from "npm:octokit@4.1.0";

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

    app.octokit.rest.repos

    for (const { octokit, repository } of yield* each(
      stream(app.eachRepository.iterator())
    )) {
      const {
        // default_branch,
        name: repo,
        owner: { login: owner },
      } = repository;

      try {
        const { data: analyses } = yield* call(() =>
          octokit.rest.codeScanning.listRecentAnalyses({
            owner,
            repo,
            headers: {
              'X-GitHub-Api-Version': '2022-11-28'
            },
            // ref: default_branch,
            ref: "mk/reports",
          })
        );

        const { data: { sha: commit } } = yield* call(() =>
          octokit.rest.repos.getCommit({
            owner,
            repo,
            // ref: default_branch,
            ref: "mk/reports",
            per_page: 1,
          })
        );

        const analysesOfLastCommit = analyses.filter(
          analysis => analysis.commit_sha === commit
        );

        console.log(`fetched ${analyses.length} analyses, ${analysesOfLastCommit.length} are associated to the latest commit`);

        for (const { id: analysis_id } of analysesOfLastCommit) {
          const { data: analysis } = yield* call(() => octokit.rest.codeScanning.getAnalysis({
            owner,
            repo,
            analysis_id,
            headers: {
              accept: "application/sarif+json",
            },
          }));

          if (analysis instanceof ArrayBuffer) {
            const filePath = new URL(`../../${repo}-${analysis_id}.sarif`, import.meta.url);
            yield* call(() => Deno.writeFile(filePath, new Uint8Array(analysis)));
            console.log(`Analysis written to ${filePath}`);
          }
        }

        // const { data: alerts } = yield* call(() =>
        //   octokit.rest.codeScanning.listAlertsForRepo({
        //     owner,
        //     repo,
        //     headers: {
        //       'X-GitHub-Api-Version': '2022-11-28'
        //     },
        //     // ref: default_branch,
        //     ref: "mk/reports",
        //   })
        // );

        // console.log(alerts);
      } catch(e) {
        if (e instanceof RequestError) {
          console.log("Skipping", repo);
          console.error(e?.response?.data);
        }
      }

      yield* each.next();
    }
  });
}
