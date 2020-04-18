// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { join, resolve } from 'path';

import { mkdirp } from 'fs-extra';
import { app, BrowserWindow } from 'electron';
import fixPath from 'fix-path';

import { isDevelopment } from './utility/env';
//isWindows
import { isMac, isWindows } from './utility/platform';
import { getUnpackedAsarPath } from './utility/getUnpackedAsarPath';
import ElectronWindow from './electronWindow';
import logger, { log } from './utility/logger';
import { parseDeepLinkUrl } from './utility/url';

const error = logger.extend('error');
const baseUrl = isDevelopment ? 'http://localhost:3000/' : 'http://localhost:5000/';

function processArgsForWindows(args: string[]): string {
  if (process.argv.length > 1) {
    return parseDeepLinkUrl(args.slice(1).toString());
  }
  return '';
}

async function main() {
  log('Starting electron app');
  app.setAsDefaultProtocolClient('bfcomposer');
  const win = ElectronWindow.getInstance().browserWindow;

  win.webContents.openDevTools();

  let deeplinkingUrl = '';

  if (isWindows()) {
    deeplinkingUrl = processArgsForWindows(process.argv);
  }

  deeplinkingUrl = baseUrl + deeplinkingUrl;
  await win.webContents.loadURL(deeplinkingUrl);
  log('DeeplinkedUrl', deeplinkingUrl);
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
    app.on('second-instance', async (e, argv) => {
      let deeplinkingUrl = '';

      if (isWindows()) {
        deeplinkingUrl = processArgsForWindows(argv);
      }
      deeplinkingUrl = baseUrl + deeplinkingUrl;

      const browserWindow: BrowserWindow = ElectronWindow.getInstance().browserWindow;
      await browserWindow.webContents.loadURL(deeplinkingUrl);
      if (browserWindow.isMinimized()) {
        browserWindow.restore();
      }
      browserWindow.focus();
    });
  } else {
    app.quit();
    return;
  }

  app.on('activate', () => {
    main();
  });

  app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (!isMac()) {
      app.quit();
    }
  });

  app.on('will-finish-launching', function() {
    app.on('open-url', function(event, url) {
      event.preventDefault();
      const deeplinkingUrl = baseUrl + parseDeepLinkUrl(url);
      if (ElectronWindow.isBrowserWindowCreated) {
        const win = ElectronWindow.getInstance().browserWindow;
        win.loadURL(deeplinkingUrl);
      }
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

  await main();
}

run()
  .catch(e => {
    error('Error occurred while starting Composer Electron: ', e);
    app.quit();
  })
  .then(() => {
    log('Run completed');
  });
