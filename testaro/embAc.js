/*
  © 2021–2023 CVS Health and/or one of its affiliates. All rights reserved.

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
  embAc
  This test reports interactive elements (links, buttons, inputs, and select lists)
  contained by links or buttons. Such embedding not only violates the HTML standard,
  but also complicates user interaction and creates risks of error. It becomes
  non-obvious what a user will activate with a click.
*/

// ########## IMPORTS

// Module to perform common operations.
const {init, getRuleResult} = require('../procs/testaro');

// ########## FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (page, withItems) => {
  // Initialize the locators and result.
  const all = await init(
    100,
    page,
    'a a, a button, a input, a select, button a, button button, button input, button select'
  );
  // For each locator:
  for (const loc of all.allLocs) {
    // Get whether its embedder is a link or a button.
    const embedderTagName = await loc.evaluate(element => {
      const embedder = element.parentElement.closest('a, button');
      return embedder ? embedder.tagName : '';
    });
    let param = 'a link or button';
    if (embedderTagName === 'A') {
      param = 'a link';
    }
    else if (embedderTagName === 'BUTTON') {
      param = 'a button';
    }
    all.locs.push([loc, param]);
  }
  // Populate and return the result.
  const whats = [
    'Interactive element is embedded in __param__',
    'Interactive elements are contained by links or buttons'
  ];
  return await getRuleResult(withItems, all, 'embAc', whats, 2);
};
