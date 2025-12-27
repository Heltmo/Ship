/**
 * Conditional logger that only outputs debug logs in development mode.
 * Prevents leaking sensitive information in production logs.
 */

const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  /**
   * Debug logs - only shown in development
   * Use for debugging information that shouldn't appear in production
   */
  debug: (...args: any[]) => {
    if (isDev) console.log(...args);
  },

  /**
   * Info logs - shown in all environments
   * Use for important application events
   */
  info: (...args: any[]) => console.log(...args),

  /**
   * Error logs - shown in all environments
   * Use for errors that need to be tracked
   */
  error: (...args: any[]) => console.error(...args),
};
