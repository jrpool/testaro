/*
  © 2025 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Juan S. Casado.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  imageLink
  Clean-room rule.
  This test reports anchor elements whose href attributes point to image files.
*/

const {simplify} = require('../procs/testaro');

exports.reporter = async (page, withItems) => {
  const ruleData = {
    ruleID: 'imageLink',
    selector: 'a[href]',
    pruner: async loc => await loc.evaluate(el => {
      const href = el.getAttribute('href') || '';
      return /\.(?:png|jpe?g|gif|svg|webp|ico)(?:$|[?#])/i.test(href);
    }),
    complaints: {
      instance: 'Link destination is an image file',
      summary: 'Links have image files as their destinations'
    },
    ordinalSeverity: 0,
    summaryTagName: 'A'
  };
  return await simplify(page, withItems, ruleData);
};
