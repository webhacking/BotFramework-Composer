// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { mkdirp } from 'fs-extra';
import { app } from 'electron';
import fixPath from 'fix-path';

import { isDevelopment } from './utility/env';
import { join, resolve } from 'path';
import { isWindows, isMac } from './utility/platform';
import { getUnpackedAsarPath } from './utility/getUnpackedAsarPath';
import ElectronWindow from './electronWindow';
import logger, { log } from './utility/logger';
import { parseDeepLinkUrl } from './utility/url';

const error = logger.extend('error');
const baseUrl = isDevelopment ? 'http://localhost:3000/' : 'http://localhost:5000/';
let deeplinkingUrl = '';

function processArgsForWindows(args: string[]): string {
  if (process.argv.length > 1) {
    return parseDeepLinkUrl(args[args.length - 1]);
  }
  return '';
}

async function createAppDataDir() {
  const appDataBasePath: string = process.env.APPDATA || process.env.HOME || '';
  const compserAppDataDirectoryName = 'BotFrameworkComposer';
  const composerAppDataPath: string = resolve(appDataBasePath, compserAppDataDirectoryName);
  process.env.COMPOSER_APP_DATA = join(composerAppDataPath, 'data.json'); // path to the actual data file
  log('creating composer app data path at: ', composerAppDataPath);
  await mkdirp(composerAppDataPath);
}

async function loadServer() {
  let pluginsDir = '';
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
}

async function main() {
  const mainWindow = ElectronWindow.getInstance().browserWindow;
  if (mainWindow) {
    if (isDevelopment) {
      mainWindow.webContents.openDevTools();
    }

    if (isWindows()) {
      deeplinkingUrl = processArgsForWindows(process.argv);
    }
    await mainWindow.webContents.loadURL(baseUrl + deeplinkingUrl);

    if (isMac()) {
      mainWindow.reload();
    }
    mainWindow.maximize();
    mainWindow.show();

    mainWindow.on('closed', function() {
      ElectronWindow.destroy();
    });
  }
}

async function run() {
  fixPath(); // required PATH fix for Mac (https://github.com/electron/electron/issues/5626)

  if (!app.isDefaultProtocolClient('bfcomposer')) {
    // Define custom protocol handler. Deep linking works on packaged versions of the application!
    app.setAsDefaultProtocolClient('bfcomposer');
  }

  // Force Single Instance Application
  const gotTheLock = app.requestSingleInstanceLock();
  if (gotTheLock) {
    app.on('second-instance', async (e, argv) => {
      if (isWindows()) {
        deeplinkingUrl = processArgsForWindows(argv);
      }

      const mainWindow = ElectronWindow.getInstance().browserWindow;
      if (mainWindow) {
        await mainWindow.webContents.loadURL(baseUrl + deeplinkingUrl);
        if (mainWindow.isMinimized()) {
          mainWindow.restore();
        }
        mainWindow.focus();
      }
    });
  } else {
    app.quit();
  }

  app.on('ready', async () => {
    log('App ready');
    await loadServer();
    log('Server has been loaded');
    await main();
  });

  // Quit when all windows are closed.
  app.on('window-all-closed', function() {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', function() {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (!ElectronWindow.isBrowserWindowCreated) {
      main();
    }
  });

  app.on('will-finish-launching', function() {
    // Protocol handler for osx
    app.on('open-url', (event, url) => {
      event.preventDefault();
      deeplinkingUrl = parseDeepLinkUrl(url);
      if (ElectronWindow.isBrowserWindowCreated) {
        const mainWindow = ElectronWindow.getInstance().browserWindow;
        mainWindow?.loadURL(baseUrl + deeplinkingUrl);
      }
    });
  });
}

run()
  .catch(e => {
    error('Error occurred while starting Composer Electron: ', e);
    app.quit();
  })
  .then(() => {
    log('Run completed');
  });
