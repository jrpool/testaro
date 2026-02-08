/*
  © 2023 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  linkExt
  This test reports links with target=_blank attributes.
*/

// IMPORTS

const {doTest} = require('../procs/testaro');

// FUNCTIONS

exports.reporter = async (page, catalog, withItems) => {
  const getBadWhat = element => {
    // Return a violation description.
    return `Link has a target=_blank attribute`;
  };
  const whats = 'Links have target=_blank attributes';
  return await doTest(
    page, catalog, withItems, 'linkExt', 'a[target=_blank]', whats, 0, 'A', getBadWhat.toString()
  );
};
