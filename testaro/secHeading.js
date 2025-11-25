/*
  © 2025 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Jonathan Robert Pool. All rights reserved.

  MIT License

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all
  copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  SOFTWARE.
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
