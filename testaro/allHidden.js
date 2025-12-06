/*
  © 2023 CVS Health and/or one of its affiliates. All rights reserved.
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
  allHidden
  This test reports a page that is entirely or mainly hidden.
*/

// FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async page => {
  // Get a count of elements deemed visible by Playwright.
  const visibleElementCount = await page.locator(':visible').count();
  // Get totals and an instance.
  const violationData = await page.evaluate(visibleElementCount => {
    const violationCount = 0;
    const instances = [];
    // If no element is visible:
    if (! visibleElementCount) {
      // Increment the violation count.
      violationCount = 1;
      const what = `The entire page is hidden or empty`;
      // Add a summary instance to the instances.
      instances.push(null, 'allHidden', what, 1, 3);
    }
    return {
      violationCount,
      instances
    };
  }, visibleElementCount);
  const {violationCount, instances} = violationData;
  // Return the result.
  return {
    data: {},
    totals: [0, 0, 0, violationCount],
    standardInstances: instances
  };
};
