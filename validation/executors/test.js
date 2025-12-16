/*
  © 2022–2023 CVS Health and/or one of its affiliates. All rights reserved.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  test.js
  Validator for one Testaro test.
  Execution example: npm test focOp
*/

const testID = process.argv[2];
const {validateTest} = require('../validateTest');
validateTest(testID);
