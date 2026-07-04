/**
 * @file post.ts
 * @description Helpers to submit custom Devvit posts with dynamic titles.
 */

import { reddit } from '@devvit/web/server';

export const createPost = async (title = 'Candy Snip Saga — Can you beat my score?') => {
  return await reddit.submitCustomPost({
    title,
  });
};
