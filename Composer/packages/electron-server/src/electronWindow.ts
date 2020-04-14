//
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license.
//
// Microsoft Bot Framework: http://botframework.com
//
// Bot Framework Emulator Github:
// https://github.com/Microsoft/BotFramwork-Emulator
//
// Copyright (c) Microsoft Corporation
// All rights reserved.
//
// MIT License:
// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to
// the following conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED ""AS IS"", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//

import { join } from 'path';

import { BrowserWindow } from 'electron';

import { isDevelopment } from './utility/env';
import { getUnpackedAsarPath } from './utility/getUnpackedAsarPath';

export default class ElectronWindow {
  private static instance: ElectronWindow;
  private _currentBrowserWindow: BrowserWindow;

  get browserWindow(): BrowserWindow {
    return ElectronWindow.instance._currentBrowserWindow;
  }

  private constructor() {
    // Create the browser window.
    const browserWindowOptions: Electron.BrowserWindowConstructorOptions = {
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: false,
      },
      show: false,
    };
    if (process.platform === 'linux' && !isDevelopment) {
      // workaround for broken .AppImage icons since electron-builder@21.0.1 removed .AppImage desktop integration
      // (https://github.com/electron-userland/electron-builder/releases/tag/v21.0.1)
      browserWindowOptions.icon = join(getUnpackedAsarPath(), 'resources/composerIcon_1024x1024.png');
    }
    this._currentBrowserWindow = new BrowserWindow(browserWindowOptions);
  }

  public static get isBrowserWindowCreated() {
    return !!ElectronWindow.instance;
  }

  public static getInstance(): ElectronWindow {
    if (!ElectronWindow.instance) {
      ElectronWindow.instance = new ElectronWindow();
    }
    return ElectronWindow.instance;
  }
}
