/*
  © 2023 CVS Health and/or one of its affiliates. All rights reserved.

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
  allHidden
  This test reports a page that is entirely or mainly hidden.
*/
exports.reporter = async page => {
  // Gets the hiddennesses of the document, body, and main region.
  const data = await page.evaluate(() => {
    // For each region:
    const {body} = document;
    const main = body && body.querySelector('main, [role=main]');
    const data = [];
    [document.documentElement, body, main].forEach(region => {
      if (! region) {
        data.push(null);
      }
      else if (region.hidden || region.ariaHidden) {
        data.push(true);
      }
      else {
        const styleDec = window.getComputedStyle(region);
        const {display, visibility} = styleDec;
        data.push(display === 'none' || visibility === 'hidden');
      }
    });
    return data;
  });
  // Get the severity totals.
  const totals = [0, data[2] ? 1 : 0, data[1] ? 1 : 0, data[0] ? 1 : 0];
  const standardInstances = [];
  data.forEach((isHidden, index) => {
    const region = [['Document', 'HTML'], ['Body', 'BODY'], ['Main region', 'MAIN']][index];
    if (isHidden) {
      standardInstances.push({
        ruleID: 'allHidden',
        what: `${region[0]} is hidden`,
        ordinalSeverity: 3 - index,
        tagName: region[1],
        id: '',
        location: {
          doc: '',
          type: '',
          spec: ''
        },
        excerpt: ''
      });
    }
  });
  return {
    data,
    totals,
    standardInstances
  };
};
