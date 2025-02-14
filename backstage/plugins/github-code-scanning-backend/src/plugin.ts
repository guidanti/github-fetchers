import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';

/**
 * githubCodeScanningPlugin backend plugin
 *
 * @public
 */

export const githubCodeScanningPlugin = createBackendPlugin({
  pluginId: 'github-code-scanning',
  register(env) {
    env.registerInit({
      deps: {
        scheduler: coreServices.scheduler,
        config: coreServices.rootConfig,
      },
      async init({ scheduler }) {
        await scheduler.scheduleTask({
          frequency: { seconds: 20 },
          timeout: { seconds: 20 },
          id: 'github-reports',
          fn: async () => { console.log("hello") },
        })
      },
    });
  },
});
