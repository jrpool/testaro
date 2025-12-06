/*
  © 2025 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Juan S. Casado. All rights reserved.
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
  Identify img elements whose alt attribute is a URL or file name.
*/

// FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (page, withItems) => {
  // Return totals and standard instances for the rule.
  return await page.evaluate(withItems => {
    // Get all candidates, i.e. img elements with alt attributes.
    const candidates = document.body.querySelectorAll('img[alt]');
    let violationCount = 0;
    const instances = [];
    // For each candidate:
    candidates.forEach(element => {
      const alt = (element.getAttribute('alt') || '').trim();
      // If it is non-empty:
      if (alt) {
        const isURL = /^(?:https?:|file:|ftp:).+$/i.test(alt);
        const isFileName = /favicon|^.+\.(?:png|jpe?g|gif|svg|webp|ico)$/i.test(alt);
        // If it is a URL or file name:
        if (isURL || isFileName) {
          // Increment the violation count.
          violationCount++;
          // If itemization is required:
          if (withItems) {
            const valueType = isURL && isFileName
            ? 'the URL of an image file'
            : (isURL ? 'a URL' : 'a file name');
            const what = `img element has an alt attribute with ${valueType} as its value`;
            // Add an instance to the instances.
            instances.push(window.getInstance(element, 'altScheme', what, 1, 2));
          }
        }
      }
    });
    // If there were any violations and itemization is not required:
    if (violationCount && ! withItems) {
      const what = 'img elements have alt attributes with URL or filename values';
      // Add a summary instance to the instances.
      instances.push(window.getInstance(null, 'altScheme', what, violationCount, 2, 'IMG'));
    }
    return {
      data: {},
      totals: [0, violationCount, 0, 0],
      standardInstances: instances
    };
  }, withItems);
};
