/*
  © 2021–2023 CVS Health and/or one of its affiliates. All rights reserved.
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
  bulk
  This test reports the count of visible elements.

  The test assumes that simplicity and compactness, with one page having one purpose,
  is an accessibility virtue. Users with visual, motor, and cognitive disabilities
  often have trouble finding what they want or understanding the purpose of a page
  if the page is cluttered with content.
*/
exports.reporter = async page => {
  // Get a count of elements deemed visible by Playwright.
  const visibleElementCount = await page.locator(':visible').count();
  // Get totals and an instance.
  const violationData = await page.evaluate(visibleElementCount => {
    // Convert the count to a severity level, treating up to 400 as non-reportable.
    const severity = Math.min(4, Math.round(visibleElementCount / 400)) - 1;
    const totals = [0, 0, 0, 0];
    const instances = [];
    // If the severity is reportable:
    if (severity > -1) {
      totals[severity] = 1;
      const what = `Page contains ${visibleElementCount} visible elements`;
      // Create an instance reporting it.
      instances.push(window.getInstance(document.documentElement, 'bulk', what, 1, severity));
    }
    return {
      totals,
      instances
    };
  }, visibleElementCount);
  const {totals, instances} = violationData;
  // Return the result.
  return {
    data: {},
    totals,
    standardInstances: instances
  };
};
