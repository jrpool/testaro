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
  adbID
  Clean-room rule: report elements that reference aria-describedby targets that are missing or ambiguous (duplicate ids).
*/

const {init, report} = require('../procs/testaro');

exports.reporter = async (page, withItems) => {
  // elements that reference aria-describedby
  const all = await init(200, page, '[aria-describedby]');
  for (const loc of all.allLocs) {
    const isBad = await loc.evaluate(el => {
      const raw = el.getAttribute('aria-describedby') || '';
      const ids = raw.trim().split(/\s+/).filter(Boolean);
      if (ids.length === 0) return false;
      // for each referenced id, check how many elements have that id
      for (const id of ids) {
        try {
          // exact match (case-sensitive)
          const exact = document.querySelectorAll('#' + CSS.escape(id));
          if (exact.length === 1) continue;
          // if not exactly one, try case-insensitive match by normalizing
          const allIds = Array.from(document.querySelectorAll('[id]')).map(e => e.getAttribute('id'));
          const ci = allIds.filter(i => i && i.toLowerCase() === id.toLowerCase()).length;
          if (ci === 1) continue;
          // otherwise it's missing or ambiguous
          return true;
        } catch (e) {
          return true;
        }
      }
      return false;
    });
    if (isBad) all.locs.push(loc);
  }

  const whats = [
    'Referenced description of the element is ambiguous or missing',
    'Referenced descriptions of elements are ambiguous or missing'
  ];
  return await report(withItems, all, 'adbID', whats, 3);
};
