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
  attVal
  This test reports elements with illicit values of an attribute.
*/

// FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (page, withItems, attributeName, areLicit, values) => {
  // Return totals and standard instances for the rule.
  return await page.evaluate(args => {
    const [withItems, attributeName, areLicit, values] = args;
    // Get all candidates, i.e. elements with the attribute.
    const candidates = document.body.querySelectorAll(`[${attributeName}]`);
    let violationCount = 0;
    const instances = [];
    // For each candidate:
    candidates.forEach(element => {
      const value = element.getAttribute(attributeName);
      // If it violates the rule:
      if (areLicit !== values.includes(value)) {
        // Increment the violation count.
        violationCount++;
        // If itemization is required:
        if (withItems) {
          const what = `Element has attribute ${attributeName} with illicit value ${value}`;
          instances.push(window.getInstance(element, 'attVal', what, 1, 2));
        }
      }
    });
    // If there were any violations and itemization is not required:
    if (violationCount && ! withItems) {
      const what = `Elements have attribute ${attributeName} with illicit values`;
      // Add a summary instance to the instances.
      instances.push(window.getInstance(null, 'attVal', what, violationCount, 2));
    }
    return {
      data: {},
      totals: [0, 0, violationCount, 0],
      standardInstances: instances
    };
  }, [withItems, attributeName, areLicit, values]);
};
