/*
  © 2025 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Juan S. Casado. All rights reserved.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  secHeading
  Flag headings that are a lower-numbered heading (e.g., H2 after H3) than the
  immediately preceding heading within the same sectioning container.
*/

const {init, getRuleResult} = require('../procs/testaro');

exports.reporter = async (page, withItems) => {
  const all = await init(200, page, 'h1,h2,h3,h4,h5,h6');
  for (const loc of all.allLocs) {
    const isBad = await loc.evaluate(el => {
      // find nearest sectioning ancestor
      let ancestor = el.parentElement;
      while (ancestor && !['SECTION','ARTICLE','NAV','ASIDE','MAIN','BODY','HTML'].includes(ancestor.tagName)) {
        ancestor = ancestor.parentElement;
      }
      if (!ancestor) return false;
      const headings = Array.from(ancestor.querySelectorAll('h1,h2,h3,h4,h5,h6'));
      const idx = headings.indexOf(el);
      if (idx <= 0) return false;
      const prev = headings[idx - 1];
      const curLevel = Number(el.tagName.substring(1));
      const prevLevel = Number(prev.tagName.substring(1));
      return curLevel < prevLevel;
    });
    if (isBad) all.locs.push(loc);
  }
  const whats = [
    'Element violates the logical level order in its sectioning container',
    'Heading elements violate the logical level order in their sectioning containers'
  ];
  return await getRuleResult(withItems, all, 'secHeading', whats, 1);
};
