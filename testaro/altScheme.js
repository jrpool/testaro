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

// IMPORTS

const {doTest} = require('../procs/testaro');

// FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (page, withItems) => {
  // Define a violation function for execution in the browser.
  const getBadWhat = element => {
    // Get the value of the alt attribute of the element.
    const alt = (element.getAttribute('alt') || '').trim();
    // If it is non-empty:
    if (alt) {
      const isURL = /^(?:https?:|file:|ftp:)\S+$/i.test(alt);
      const isFileName = /favicon|^\S+\.(?:png|jpe?g|gif|svg|webp|ico)$/i.test(alt);
      // If it is a URL or file name:
      if (isURL || isFileName) {
        const valueType = isURL && isFileName
        ? 'the URL of an image file'
        : (isURL ? 'a URL' : 'a file name');
        // Return a violation description.
        return `img element has an alt attribute with ${valueType} as its value`;
      }
    }
  };
  const whats = 'img elements have alt attributes with URL or filename values';
  // Perform the test and return the result.
  return doTest(
    page, withItems, 'altScheme', 'img[alt]', whats, 1, 'IMG', getBadWhat.toString()
  );
};
