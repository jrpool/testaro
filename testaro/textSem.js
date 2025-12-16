/*
  © 2025 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Juan S. Casado. All rights reserved.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  textSem
  Report semantically vague inline elements: i, b, small
*/

const {init, getRuleResult} = require('../procs/testaro');

exports.reporter = async (page, withItems) => {
  const all = await init(100, page, 'i, b, small');
  for (const loc of all.allLocs) {
    // Consider only elements with visible text
    const isBad = await loc.evaluate(el => {
      const text = (el.textContent || '').trim();
      return !!text;
    });
    if (isBad) all.locs.push(loc);
  }
  const whats = [
    'Element is semantically vague',
    'Semantically vague elements i, b, and/or small are used'
  ];
  return await getRuleResult(withItems, all, 'textSem', whats, 0);
};
