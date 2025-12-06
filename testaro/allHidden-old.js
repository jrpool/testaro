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
  // Get data on violations of the rule.
  const violationData = await page.evaluate(() => {
    // Get all candidates, i.e. the regions that should never be hidden.
    const regions = {
      html: {
        element: document.documentElement,
        severity: 3
      },
      body: {
        element: document.body,
        severity: 2
      },
      main: {
        element: document.querySelector('main, [role=main]'),
        severity: 1
      }
    };
    let violationCounts = [0, 0, 0, 0];
    const instances = [];
    // For each candidate:
    Object.keys(regions).forEach(regionName => {
      const region = regions[regionName];
      const {element, severity} = region;
      console.log(`XXX ${regionName}`);
      const tagName = regionName.toUpperCase();
      // If it is not main and does not exist:
      if (! element && regionName !== 'main') {
        console.log(`XXX ${regionName} is not main anddoes not exist`);
        // Increment the violation count.
        violationCounts[3]++;
        // Add an instance to the instances.
        const what = `The ${regionName} region does not exist`;
        // Add a summary instance to the instances.
        instances.push(window.getInstance(null, 'allHidden', what, 1, 3, tagName));
      }
      // Otherwise, if it exists:
      else if (element) {
        console.log(`XXX ${regionName} exists`);
        const styleDec = window.getComputedStyle(element);
        const {display, visibility} = styleDec;
        // If it is hidden:
        if (display === 'none' || visibility === 'hidden' || element.ariaHidden === 'true') {
          // Increment the violation count.
          violationCounts[severity]++;
          // Add an instance to the instances.
          const what = `The ${regionName} region is hidden`;
          // Add an instance to the instances.
          instances.push(window.getInstance(element, 'allHidden', what, 1, severity, tagName));
        }
      }
    });
    return {
      violationCounts,
      instances
    };
  });
  const {violationCounts, instances} = violationData;
  // Return the result.
  return {
    data: {},
    totals: violationCounts,
    standardInstances: instances
  };
};
