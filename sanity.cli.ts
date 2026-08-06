import { defineCliConfig } from 'sanity/cli';
import { dataset, projectId } from './src/sanity/env';

export default defineCliConfig({
  api: { projectId, dataset },
  studioHost: 'reiseceylon',
  /* Pinned so redeploys go to the same app instead of prompting. */
  deployment: { appId: 'e8oc56wsmte4x632rn1kk3ro' }
});
