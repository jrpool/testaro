/*
  © 2021–2024 CVS Health and/or one of its affiliates. All rights reserved.
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
  focAndOp
  Related to Tenon rule 190.

  This test reports discrepancies between Tab-focusability and operability. The standard practice
  is to make focusable elements operable and operable elements focusable. If focusable elements are
  not operable, users are likely to be surprised that nothing happens when they try to operate such
  elements. Conversely, if operable elements are not focusable, users who navigate with a
  keyboard are prevented from operating those elements.  The test considers an element
  Tab-focusable if its tabIndex property has the value 0. The test considers an element operable if
  it has a non-inherited pointer cursor and is not a 'LABEL' element, has an operable tag name, has
  an interactive explicit role, or has an 'onclick' attribute.
*/

// IMPORTS

const {doTest} = require('../procs/testaro');

// FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (page, withItems) => {
  const getBadWhat = element => {
    // Get whether the element is visible.
    const isVisible = element.checkVisibility({
      contentVisibilityAuto: true,
      opacityProperty: true,
      visibilityProperty: true
    });
    // If so:
    if (isVisible) {
      // Get whether it is focusable.
      const isFocusable = element.tabIndex === 0;
      // Get the operable tagnames.
      const opTags = new Set(['A', 'BUTTON', 'IFRAME', 'INPUT','OPTION', 'SELECT', 'TEXTAREA']);
      // Get the operable roles.
      const opRoles = new Set([
        'button',
        'checkbox',
        'combobox',
        'composite',
        'grid',
        'gridcell',
        'input',
        'link',
        'listbox',
        'menu',
        'menubar',
        'menuitem',
        'menuitemcheckbox',
        'option',
        'radio',
        'radiogroup',
        'scrollbar',
        'searchbox',
        'select',
        'slider',
        'spinbutton',
        'switch',
        'tab',
        'tablist',
        'textbox',
        'tree',
        'treegrid',
        'treeitem',
        'widget',
      ]);
      // Initialize the operabilities of the element.
      const opHow = [];
      let hasPointer = false;
      // If the element is not a label:
      if (element.tagName !== 'LABEL') {
        const styleDec = window.getComputedStyle(element);
        hasPointer = styleDec.cursor === 'pointer';
        // If it has a pointer cursor:
        if (hasPointer) {
          // Neutralize the cursor style of the parent element of the element.
          element.parentElement.style.cursor = 'default';
          // Get whether, after this, the element still has a pointer cursor.
          hasPointer = styleDec.cursor === 'pointer';
          // Add this to the operabilities of the element.
          opHow.push('pointer cursor');
        }
      }
      // If the element has a click event listener:
      if (element.onclick) {
        // Add this to the operabilities.
        opHow.push('click listener');
      }
      // If the element has an operable explicit role:
      const role = element.getAttribute('role');
      if (opRoles.has(role)) {
        // Add this to the operabilities.
        opHow.push(`role ${role}`);
      }
      // If the element has an operable tagname:
      const tagName = element.tagName;
      if (opTags.has(tagName)) {
        // Add this to the operabilities.
        opHow.push(`tagname ${tagName}`);
      }
      const isOperable = opHow.length > 0;
      // If the element is focusable but not operable:
      if (isFocusable && ! isOperable) {
        // Return a severity and violation description.
        return '2:Element is Tab-focusable but not operable';
      }
      // Otherwise, if it is operable but not focusable:
      else if (isOperable && ! isFocusable) {
        // Return a severity and violation description.
        return `3:Element is operable (${opHow.join(', ')}) but not Tab-focusable`;
      }
    }
  };
  const whats = 'Elements are Tab-focusable but not operable or vice versa';
  return doTest(
    page, withItems, 'focAndOp', 'body *', whats, 2, null, getBadWhat.toString()
  );
};
