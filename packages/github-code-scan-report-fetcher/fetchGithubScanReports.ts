import {
  call,
  stream,
  each,
  type Queue,
} from "npm:effection@4.0.0-alpha.5";
import { App, RequestError } from "npm:octokit@4.1.0";

export function* fetchGithubScanReports({
  app,
  results,
  logger,
}: {
  app: App,
  results: Queue<any, void>, // 🚨
  logger: typeof console,
}) {
  for (const { octokit, repository } of yield* each(
    stream(app.eachRepository.iterator())
  )) {
    const {
      default_branch,
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
          ref: default_branch,
        })
      );

      const { data: { sha: commit } } = yield* call(() =>
        octokit.rest.repos.getCommit({
          owner,
          repo,
          ref: default_branch,
          per_page: 1,
        })
      );

      const analysesOfLastCommit = analyses.filter(
        analysis => analysis.commit_sha === commit
      );

      logger.log(`fetched ${analyses.length} analyses, ${analysesOfLastCommit.length} are associated to the latest commit`);

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
          results.add(new TextDecoder("utf-8").decode(analysis));
        }
      }
    } catch(e) {
      if (e instanceof RequestError) {
        logger.error("Skipping", repo, e?.response?.data);
      }
    }

    yield* each.next();
  }
}
