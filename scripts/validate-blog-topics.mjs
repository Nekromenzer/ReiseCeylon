import { loadTopics } from './blog-automation-lib.mjs';

const topics = await loadTopics();
console.log(`Validated ${topics.length} blog topics.`);
