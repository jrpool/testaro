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
  datalistRef
  Report inputs whose list attribute references a missing or ambiguous datalist
*/

// IMPORTS

const {doTest} = require('../procs/testaro');

// FUNCTIONS

exports.reporter = async (page, withItems) => {
  const getBadWhat = element => {
    // Get the ID of the datalist element referenced by the list attribute of the element.
    const listID = element.getAttribute('list');
    // If the element has a list attribute with a non-empty value:
    if (listID) {
      // Get the element it references.
      const listElement = document.getElementById(listID);
      // If no such element exists:
      if (! listElement) {
        // Return a violation description.
        return 'input element list attribute references a missing element';
      }
      // Otherwise, if the element it references is not a datalist:
      if (listElement.tagName.toLowerCase() !== 'datalist') {
        // Return a violation description.
        return 'input element list attribute references a non-datalist element';
      }
    }
    // Otherwise, i.e. if it has no list attribute with a non-empty value:
    else {
      // Return a violation description.
      return 'input element list attribute is empty';
    }
  };
  const whats = 'list attributes of input elements are empty or IDs of no or non-datalist elements';
  return await doTest(
    page, withItems, 'datalistRef', 'input[list]', whats, 3, 'INPUT', getBadWhat.toString()
  );
};
