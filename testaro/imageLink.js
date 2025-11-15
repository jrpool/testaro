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
  imageLink
  Clean-room rule: flag anchor elements whose `href` points to an image file.
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
