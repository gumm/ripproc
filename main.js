'use strict';
import process from 'node:process';

const identity = i => i;

/**
 * @param logger
 * @returns {Set<function|Promise>}
 */
export default (logger = undefined) => {
  const log = logger || console;
  const killSet = new Set();

  const finalExit = () => {
    log.info('Shutdown Complete');
    process.exit(0);
  }

  const gracefulShutdown = async () => {
    log.warn('Received kill signal, shutting down gracefully.');
    for (const p of [...killSet]) {
      await p();
    }
    finalExit()
  };

  // Register listeners for kill signals
  // listen for TERM signal .e.g. kill
  process.once('SIGTERM', () => gracefulShutdown().then(identity));

  // listen for INT signal e.g. Ctrl-C
  process.once('SIGINT', () => gracefulShutdown().then(identity));

  // Listen for pm2 shutdown message.
  process.on('message', msg => {
    if (msg === 'shutdown') {
      gracefulShutdown().then(identity);
    }
  });

  return killSet;
}