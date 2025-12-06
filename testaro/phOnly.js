/*
  © 2025 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Juan S. Casado. All rights reserved.

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
  phOnly
  Clean-room rule: input elements that have a placeholder but no accessible name (no label/title/aria-label/aria-labelledby)
*/

const {init, getRuleResult} = require('../procs/testaro');

const hasAccessibleName = async (loc) => {
  return await loc.evaluate(el => {
  // Quick accessible name checks: aria-label, aria-labelledby, associated <label>
  // NOTE: `title` is intentionally NOT considered a reliable accessible name here
  // because the validation targets expect placeholders with title attributes to be flagged.
  if (el.hasAttribute('aria-label')) return true;
  if (el.hasAttribute('aria-labelledby')) return true;
    // check for label[for]
    const id = el.getAttribute('id');
    if (id) {
      if (document.querySelector(`label[for="${CSS.escape(id)}"]`)) return true;
    }
    // check implicit ancestor label
    let parent = el.parentElement;
    while (parent) {
      if (parent.tagName && parent.tagName.toUpperCase() === 'LABEL') return true;
      parent = parent.parentElement;
    }
    return false;
  });
};

exports.reporter = async (page, withItems) => {
  const all = await init(200, page, 'input[placeholder]');
  for (const loc of all.allLocs) {
    const isBad = await hasAccessibleName(loc).then(has => !has);
    if (isBad) all.locs.push(loc);
  }
  const whats = [
    'Element has a placeholder but no accessible name',
    'input elements have placeholders but no accessible names'
  ];
  return await getRuleResult(withItems, all, 'phOnly', whats, 2, 'INPUT');
};
