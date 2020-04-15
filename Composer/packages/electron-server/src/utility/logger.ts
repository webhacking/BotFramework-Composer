// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import fs from 'fs';

import debug from 'debug';

import ElectronWindow from '../electronWindow';

export default debug('composer');

export function log(arg1, arg2 = '') {
  if (ElectronWindow.isBrowserWindowCreated) {
    ElectronWindow.getInstance().browserWindow.webContents.executeJavaScript(`console.log("${arg1} --- ${arg2}")`);
  }
  console.log(`${arg1} --- ${arg2}`);
  fs.appendFile('helloworld.txt', `\n${arg1} --- ${arg2}`, function(err) {
    if (err) return console.log(err);
  });
}
