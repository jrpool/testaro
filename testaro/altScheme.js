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
  altScheme
  Identify img elements whose alt attribute is an entire URL or clearly a file name (favicon).
*/

const {init, getRuleResult} = require('../procs/testaro');

exports.reporter = async (page, withItems) => {
  // Candidate images: any img with an alt attribute (including empty)
  const all = await init(100, page, 'img[alt]');
  for (const loc of all.allLocs) {
    const isBad = await loc.evaluate(el => {
      const alt = (el.getAttribute('alt') || '').trim();
      if (!alt) return false;
  // full-string URL (http(s) or file or ftp) — must be the entire alt value
  if (/^\s*(?:https?:|file:|ftp:)\S+\s*$/i.test(alt)) return true;
      // favicon or typical file names
      if (/favicon/i.test(alt)) return true;
  // common image file extensions that occupy the entire alt or are the base filename
  if (/^\s*\S+\.(?:png|jpe?g|gif|svg|webp|ico)\s*$/i.test(alt)) return true;
      // match exact equality with src or href attributes
      const href = (el.getAttribute('href') || el.getAttribute('src') || '').trim();
      if (href && alt === href) return true;
      return false;
    });
    if (isBad) all.locs.push(loc);
  }
  const whats = [
    'Element has an alt attribute with a URL as its entire value',
    'img elements have alt attributes with URLs as their entire values'
  ];
  return await getRuleResult(withItems, all, 'altScheme', whats, 2);
};
