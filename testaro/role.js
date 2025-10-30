/*
  © 2021–2025 CVS Health and/or one of its affiliates. All rights reserved.
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
  role
  This test reports elements with native-replacing explicit role attributes.
*/

// IMPORTS

// Module to perform common operations.
const {init, report} = require('../procs/testaro');

// CONSTANTS

  // Implicit roles
  const roleImplications = {
    article: 'article',
    aside: 'complementary',
    button: 'button',
    datalist: 'listbox',
    dd: 'definition',
    details: 'group',
    dfn: 'term',
    dialog: 'dialog',
    dt: 'term',
    fieldset: 'group',
    figure: 'figure',
    h1: 'heading',
    h2: 'heading',
    h3: 'heading',
    h4: 'heading',
    h5: 'heading',
    h6: 'heading',
    hr: 'separator',
    html: 'document',
    'input[type=number]': 'spinbutton',
    'input[type=text]': 'textbox',
    'input[type=text, list]': 'combobox',
    li: 'listitem',
    main: 'main',
    math: 'math',
    menu: 'list',
    nav: 'navigation',
    ol: 'list',
    output: 'status',
    progress: 'progressbar',
    summary: 'button',
    SVG: 'graphics-document',
    table: 'table',
    tbody: 'rowgroup',
    textarea: 'textbox',
    tfoot: 'rowgroup',
    thead: 'rowgroup',
    tr: 'row',
    ul: 'list'
  };
  const implicitRoles = new Set(Object.values(roleImplications));

// FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (page, withItems) => {
  // Get locators for all elements with explicit roles.
  const all = await init(100, page, '[role]');
  // For each locator:
  for (const loc of all.allLocs) {
    // Get the explicit role of the element.
    const role = await loc.getAttribute('role');
    // If it is also implicit:
    if (implicitRoles.has(role)) {
      // Add the locator to the array of violators.
      all.locs.push([loc, role]);
    }
  }
  // Populate and return the result.
  const whats = [
    'Element has an explicit __param__ role, which is also an implicit HTML element role',
    'Elements have roles assigned that are also implicit roles of HTML elements'
  ];
  return await report(withItems, all, 'role', whats, 0);
};
