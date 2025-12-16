/*
  © 2022–2024 CVS Health and/or one of its affiliates. All rights reserved.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  tests.js
  Validator for Testaro tests.
*/

// IMPORTS

const fs = require('fs').promises;
const {validateTest} = require('../validateTest');

// OPERATION

// Get the names of the Testaro tes files.
fs.readdir(`${__dirname}/../../testaro/`)
// When they arrive:
.then(async fileNames => {
  // For each file name:
  for (const fileName of fileNames) {
    // Get the test ID from it by disregarding its extension.
    const testID = fileName.replace(/\..+$/, '');
    // Validate the test.
    console.log(`### Validating Testaro test ${testID}`);
    await validateTest(testID);
  }
});
