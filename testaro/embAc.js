/*
  © 2021–2023 CVS Health and/or one of its affiliates. All rights reserved.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  embAc
  This test reports interactive elements (links, buttons, inputs, and select lists) contained by links or buttons. Such embedding not only violates the HTML standard, but also complicates user interaction and creates risks of error. It becomes non-obvious what a user will activate with a click.
*/

// IMPORTS

const {doTest} = require('../procs/testaro');

// FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (page, catalog, withItems) => {
  const getBadWhat = element => {
    // Get whether the embedding element is a link or a button.
    const embedder = element.parentElement.closest('a, button');
    const embedderWhat = embedder.tagName.toLowerCase() === 'a' ? 'a link' : 'a button';
    // Return a violation description.
    return `interactive element is embedded in ${embedderWhat}`;
  };
  const selector = ['a', 'button', 'input', 'select']
  .map(tag => `a ${tag}, button ${tag}`)
  .join(', ');
  const whats = 'interactive elements are embedded in links or buttons';
  return await doTest(page, catalog, withItems, 'embAc', selector, whats, 2, getBadWhat.toString());
};
