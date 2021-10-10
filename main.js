'use strict';
import process from 'node:process';

/**
 * @param logger
 * @returns {(function(function|promise, string=): void)}
 */
export default (logger = undefined) => {
  const log = logger || console;
  const killSet = new Set();
  let isInProgress = false;

  const gracefulShutdown = async (signal, viaPm2 = false) => {
    if (isInProgress) {
      return;
    }
    isInProgress = true;
    log.warn('Received kill signal, shutting down gracefully.');
    for(const funcArr of [...killSet]) {
      try {
        await Promise.resolve(funcArr[0]());
        if (funcArr[1]) {
          log.info(funcArr[1])
        }
      } catch (e) {
        log.warn(e)
      }
    }
    log.info('Shutdown Complete');
    if (viaPm2 === true) {
      process.exit(128 + signal);
    } else {
      process.exit(0);
    }
  };

  // Register listeners for kill signals
  // listen for TERM signal .e.g. kill
  process.once('SIGTERM', gracefulShutdown);

  // listen for INT signal e.g. Ctrl-C
  process.once('SIGINT', gracefulShutdown);

  // Listen for pm2 shutdown message.
  process.on('message', msg => {
    if (msg === 'shutdown') {
      gracefulShutdown(-128, true);
    }
  });

  /**
   * @param {Function|Promise} f
   * @param {string=} msg
   */
  return (f, msg = undefined) => {
    killSet.add([f, msg])
  }
}