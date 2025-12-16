/*
  © 2021–2025 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  role
  This test reports elements with native-replacing explicit role attributes.
*/

// IMPORTS

// Module to perform common operations.
const {init, getRuleResult} = require('../procs/testaro');

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
  return await getRuleResult(withItems, all, 'role', whats, 0);
};
