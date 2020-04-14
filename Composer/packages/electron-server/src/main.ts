// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { join, resolve } from 'path';

import { mkdirp } from 'fs-extra';
import { app, BrowserWindow } from 'electron';
import fixPath from 'fix-path';

import { isDevelopment } from './utility/env';
import { isWindows, isMac } from './utility/platform';
import { getUnpackedAsarPath } from './utility/getUnpackedAsarPath';
import ElectronWindow from './electronWindow';
import logger, { log } from './utility/logger';
const error = logger.extend('error');

let deeplinkingUrl;

function main() {
  log('Starting electron app');

  const win = ElectronWindow.getInstance().browserWindow;

  // and load the index.html of the app.
  const CONTENT_URL = isDevelopment ? 'http://localhost:3000/' : 'http://localhost:5000/';
  log('Loading project from: ', CONTENT_URL);

  log(`THE TRUTH IS ${deeplinkingUrl}`);

  win.loadURL(CONTENT_URL);
  win.maximize();
  win.show();
}

async function createAppDataDir() {
  const appDataBasePath: string = process.env.APPDATA || process.env.HOME || '';
  const compserAppDataDirectoryName = 'BotFrameworkComposer';
  const composerAppDataPath: string = resolve(appDataBasePath, compserAppDataDirectoryName);
  process.env.COMPOSER_APP_DATA = join(composerAppDataPath, 'data.json'); // path to the actual data file
  log('creating composer app data path at: ', composerAppDataPath);
  await mkdirp(composerAppDataPath);
}

async function run() {
  fixPath(); // required PATH fix for Mac (https://github.com/electron/electron/issues/5626)

  const gotTheLock = app.requestSingleInstanceLock(); // Force Single Instance Application
  if (gotTheLock) {
    app.on('second-instance', (e, argv) => {
      log('Inside second instance');
      if (isWindows()) {
        deeplinkingUrl = argv.slice(1);
      }
      if (ElectronWindow.isBrowserWindowCreated) {
        const browserWindow: BrowserWindow = ElectronWindow.getInstance().browserWindow;
        if (browserWindow.isMinimized()) {
          browserWindow.restore();
        }
        browserWindow.focus();
      }
    });
  } else {
    app.quit();
    return;
  }

  app.on('activate', () => {
    main();
  });

  // Quit when all windows are closed.
  app.on('window-all-closed', function() {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (isMac()) {
      app.quit();
    }
  });

  app.on('will-finish-launching', function() {
    app.on('open-url', function(event, url) {
      event.preventDefault();
      deeplinkingUrl = url;
      log(`Locked and loaded: ${deeplinkingUrl}`);
    });
  });

  log('Waiting for app to be ready...');
  await app.whenReady();
  log('App ready');

  let pluginsDir = ''; // let this be assigned by start() if in development
  if (!isDevelopment) {
    // only change paths if packaged electron app
    const unpackedDir = getUnpackedAsarPath();
    process.env.COMPOSER_RUNTIME_FOLDER = join(unpackedDir, 'build', 'templates');
    pluginsDir = join(unpackedDir, 'build', 'plugins');
  }

  // only create a new data directory if packaged electron app
  log('Creating app data directory...');
  await createAppDataDir();
  log('Created app data directory.');

  log('Starting server...');
  const { start } = await import('@bfc/server');
  await start(pluginsDir);
  log('Server started. Rendering application...');

  main();
}

run()
  .catch(e => {
    error('Error occurred while starting Composer Electron: ', e);
    app.quit();
  })
  .then(() => {
    log('Run completed');
  });
