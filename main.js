'use strict';
import process from 'node:process';

/**
 * @param logger
 * @returns {Set<Function|Promise>}
 */
export default (logger = undefined) => {
  const log = logger || console;
  const killSet = new Set();

  const gracefulShutdown = async () => {
    log.warn('Received kill signal, shutting down gracefully.');
    for(const func of [...killSet]) {
      try {
        await func();
      } catch (e) {
        log.warn(e)
      }
    }
    log.info('Shutdown Complete');
    process.exit(0);
  };

  // Register listeners for kill signals
  // listen for TERM signal .e.g. kill
  process.once('SIGTERM', gracefulShutdown);

  // listen for INT signal e.g. Ctrl-C
  process.once('SIGINT', gracefulShutdown);

  // Listen for pm2 shutdown message.
  process.on('message', msg => {
    if (msg === 'shutdown') {
      gracefulShutdown().then(e => e);
    }
  });

  return killSet;

  // /**
  //  * @param {Function|Promise} f
  //  * @param {string} msg
  //  */
  // return (f, msg = undefined) => {
  //   killSet.add(() =>
  //       Promise.resolve(f()).then(() => {if (msg) { log.info(msg) }})
  //   )
  // }

}