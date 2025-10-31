/*
  © 2023–2024 CVS Health and/or one of its affiliates. All rights reserved.
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
  headEl
  Related to ASLint rule elements-not-allowed-in-head.
  This test reports invalid descendants of the head of the document.
*/

// ########## FUNCTIONS

// Performs the test.
exports.reporter = async page => {
  // Initialize the data and standard result.
  const data = {
    total: 0,
    badTagNames: []
  };
  let totals = [];
  const standardInstances = [];
  // Get the tag names of the elements in the head, even if the head tags are omitted.
  const headElTagNames = await page.evaluate(() => {
    const head = document.head;
    const headChildren = head.children;
    const tagNames = [];
    for (const child of headChildren) {
      tagNames.push(child.tagName);
    }
    return tagNames;
  });
  const validTagNames = [
    'BASE',
    'LINK',
    'META',
    'SCRIPT',
    'STYLE',
    'TITLE',
    'NOSCRIPT',
    'TEMPLATE'
  ];
  // For each head child:
  headElTagNames.forEach(tagName => {
    // If it is invalid:
    if (! validTagNames.includes(tagName)) {
      // Add its tag name to the result.
      data.total++;
      data.badTagNames.push(tagName);
    }
  });
  // If there are any instances:
  if (data.total) {
    // Add a summary instance.
    standardInstances.push({
      ruleID: 'headEl',
      what: `Invalid elements within the head: ${data.badTagNames.join(', ')}`,
      ordinalSeverity: 2,
      count: data.total,
      location: {
        doc: '',
        type: '',
        spec: ''
      },
      excerpt: ''
    });
  }
  totals = [0, 0, data.total, 0];
  // Return the data.
  return {
    data,
    totals,
    standardInstances
  };
};
