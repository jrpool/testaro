/*
  © 2021–2025 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  aceconfig
  Configuration for the ibm tool.
*/

const os = require('os');

const tmpDir = os.tmpdir();

module.exports = {
  reportLevels: [
    'violation',
    'recommendation'
  ],
  cacheFolder: tmpDir,
  outputFolder: tmpDir,
  puppeteerArgs: ['--no-sandbox', '--disable-setuid-sandbox']
};
