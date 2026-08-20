/*
  © 2021–2023 CVS Health and/or one of its affiliates. All rights reserved.
  © 2026 Jeff Witt.
  © 2025–2026 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  focAll
  This test reports discrepancies between the visible focusable elements of a page and the elements actually reached with the Tab (or, in webkit, Option-Tab) key. The test first identifies and marks all the visible focusable elements, i.e. those with a nonnegative tabIndex, except elements that browsers exclude from Tab navigation (disabled elements, inert elements, and a and area elements without href attributes). Radio buttons are grouped as browsers group them: radio buttons sharing a name and a form owner belong to one group, and the group is reachable with one Tab keypress, but each radio button without a name is independently reachable. Then the test repeatedly presses the Tab (or Option-Tab) key until it has reached all the elements it can, marking each reached element. Finally, the test reports each focusable element that was never reached (for example, because keypresses cause surprising changes in content or focus) and each reached element that was not a visible focusable element when the page was loaded (for example, because it was revealed only during navigation or was invisible although Tab-focusable). Any such element can make navigation with the Tab key difficult or impossible.
*/

// IMPORTS

const {getXPathCatalogIndex} = require('../procs/xPath');

// FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (page, report, _, withItems) => {
  // Get locators of visible elements.
  const locAll = await page.locator('body *:visible');
  // Mark the focusable elements and get the count of Tab stops among them.
  const focusableCount = await locAll.evaluateAll(elements => {
    // Get the focusable elements, i.e. those that can be reached with the Tab key.
    const focusables = elements.filter(element => {
      // If the element has a negative tabIndex, it is not focusable.
      if (element.tabIndex < 0) {
        return false;
      }
      // If the element or an ancestor is disabled or inert, it is not focusable.
      if (element.matches(':disabled') || element.closest('[inert]')) {
        return false;
      }
      // If the element is an a or area element without an href attribute, it is not focusable.
      if (['A', 'AREA'].includes(element.tagName) && ! element.hasAttribute('href')) {
        return false;
      }
      return true;
    });
    // Mark them.
    focusables.forEach(element => {
      element.dataset.testarofocusable = 'true';
    });
    // Get the radio buttons among them that browsers group, i.e. those with names.
    const namedRadios = focusables.filter(
      element => element.tagName === 'INPUT' && element.type === 'radio' && element.name
    );
    // Get the identifiers (form owner and name) of their groups.
    const groupIDs = new Set(namedRadios.map(radio => {
      const formIndex = radio.form ? Array.prototype.indexOf.call(document.forms, radio.form) : -1;
      return `${formIndex}:${radio.name}`;
    }));
    // Return the count of Tab stops, counting each radio-button group as only 1.
    return focusables.length - namedRadios.length + groupIDs.size;
  });
  /*
    Repeatedly perform a Tab or (in webkit) Opt-Tab keypress and count the focused elements.
    Asumptions:
      0. No page has more than 2000 focusable elements.
      1. No shadow root that reports itself as the active element has more than 100 focusable
        descendants.
  */
  let tabFocused = 0;
  let refocused = 0;
  const keyName = page.context().browser()?.browserType().name() === 'webkit' ? 'Alt+Tab' : 'Tab';
  while (refocused < 100 && tabFocused < 2000) {
    await page.keyboard.press(keyName);
    const isNewFocus = await page.evaluate(() => {
      let focus = document.activeElement;
      // If the focus is in a shadow DOM, get the innermost focused element.
      while (focus && focus.shadowRoot && focus.shadowRoot.activeElement) {
        focus = focus.shadowRoot.activeElement;
      }
      if (focus === null || focus.tagName === 'BODY' || focus.dataset.testarofocused) {
        return false;
      }
      else {
        focus.dataset.testarofocused = 'true';
        return true;
      }
    });
    if (isNewFocus) {
      tabFocused++;
    }
    else {
      refocused++;
    }
  }
  // Get the XPaths of the elements violating the rule, in both directions.
  const {unreached, unexpected} = await page.evaluate(() => {
    // Get all elements, including any in open shadow roots.
    const allElements = [];
    const addElements = root => {
      root.querySelectorAll('*').forEach(element => {
        allElements.push(element);
        if (element.shadowRoot) {
          addElements(element.shadowRoot);
        }
      });
    };
    addElements(document);
    // Returns the identifier of the group of a radio button.
    const getGroupID = radio => {
      const formIndex = radio.form ? Array.prototype.indexOf.call(document.forms, radio.form) : -1;
      return `${formIndex}:${radio.name}`;
    };
    // Get the identifiers of the radio-button groups with any reached member.
    const reachedGroupIDs = new Set(
      allElements
      .filter(
        element => element.dataset.testarofocused
        && element.tagName === 'INPUT'
        && element.type === 'radio'
        && element.name
      )
      .map(getGroupID)
    );
    // Initialize the violation data.
    const unreached = [];
    const unexpected = [];
    // For each element:
    allElements.forEach(element => {
      const wasFocusable = !! element.dataset.testarofocusable;
      const wasFocused = !! element.dataset.testarofocused;
      // If it was focusable but was never reached:
      if (wasFocusable && ! wasFocused) {
        const isGroupedRadio = element.tagName === 'INPUT'
        && element.type === 'radio'
        && element.name;
        // If it is not a member of a radio-button group with another reached member:
        if (! (isGroupedRadio && reachedGroupIDs.has(getGroupID(element)))) {
          // Add its XPath to the violation data.
          unreached.push(window.getXPath(element) ?? '/html');
        }
      }
      // Otherwise, if it was reached but was not a visible focusable element:
      else if (wasFocused && ! wasFocusable) {
        // Get whether it is a scrollable container, which some browsers make Tab-focusable.
        const styleDec = window.getComputedStyle(element);
        const isScroller = ['auto', 'scroll'].includes(styleDec.overflowY)
        && element.scrollHeight > element.clientHeight
        || ['auto', 'scroll'].includes(styleDec.overflowX)
        && element.scrollWidth > element.clientWidth;
        // If it is not a scrollable container made focusable by the browser alone:
        if (! (isScroller && element.tabIndex < 0)) {
          // Add its XPath to the violation data.
          unexpected.push(window.getXPath(element) ?? '/html');
        }
      }
      // Remove the marker attributes from the element.
      delete element.dataset.testarofocusable;
      delete element.dataset.testarofocused;
    });
    return {unreached, unexpected};
  });
  const count = unreached.length + unexpected.length;
  const data = {
    focusableCount,
    tabFocused,
    discrepancy: tabFocused - focusableCount,
    unreachedCount: unreached.length,
    unexpectedCount: unexpected.length
  };
  // Initialize the standard instances.
  const standardInstances = [];
  // If itemization is required:
  if (withItems) {
    // For each element that was focusable but was never reached:
    unreached.forEach(xPath => {
      // Add an instance to the standard instances.
      standardInstances.push({
        ruleID: 'focAll',
        what: 'Element is focusable but was not reached by Tab navigation',
        ordinalSeverity: 2,
        count: 1,
        catalogIndex: getXPathCatalogIndex(report, xPath)
      });
    });
    // For each element that was reached but was not a visible focusable element:
    unexpected.forEach(xPath => {
      // Add an instance to the standard instances.
      standardInstances.push({
        ruleID: 'focAll',
        what: 'Element was reached by Tab navigation but was not a visible focusable element',
        ordinalSeverity: 2,
        count: 1,
        catalogIndex: getXPathCatalogIndex(report, xPath)
      });
    });
  }
  // Otherwise, if there were any violations:
  else if (count) {
    // Add a summary instance to the standard instances.
    standardInstances.push({
      ruleID: 'focAll',
      what: 'Some focusable elements are not Tab-focusable or vice versa',
      ordinalSeverity: 2,
      count,
      catalogIndex: getXPathCatalogIndex(report, '/html/body')
    });
  }
  // Return the result.
  return {
    data,
    totals: [0, 0, count, 0],
    standardInstances
  };
};
