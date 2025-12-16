/*
  © 2022–2023 CVS Health and/or one of its affiliates. All rights reserved.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  good.js
  Script for validation/tests/targets/tabNav/good.html.
*/

// UTILITIES FOR EVENT HANDLERS

// Returns whether an element is a tab.
const isTab = element => element.getAttribute('role') === 'tab';
// Returns the tab list containing a tab.
const allTabs = button => Array.from(button.parentElement.children);
// Returns the panel controlled by a tab.
const controlledPanel = button => document.getElementById(button.getAttribute('aria-controls'));
// Returns the tab panels controlled by the tabs of a tab list.
const allPanels = button => Array.from(controlledPanel(button).parentElement.children);
// Exposes only the tab panel controlled by a button.
const showPanel = button => {
  allPanels(button).forEach(panel => {
    panel.setAttribute('hidden', '');
  });
  controlledPanel(button).removeAttribute('hidden');
};
// Makes a tab active.
const makeActive = button => {
  allTabs(button).forEach(tab => {
    tab.tabIndex = -1;
    tab.classList.remove('active');
  });
  button.tabIndex = 0;
  button.classList.add('active');
};
// Returns the destination of a keyboard navigation within a tab list.
const destinationTab = (fromTab, key) => {
  const tabs = allTabs(fromTab);
  const tabCount = tabs.length;
  const fromIndex = tabs.indexOf(fromTab);
  // Return the destination of navigation.
  if (key === 'ArrowRight') {
    return tabs[(fromIndex + 1) % tabCount];
  }
  else if (key === 'ArrowLeft') {
    return tabs[(tabCount + fromIndex - 1) % tabCount];
  }
  else if (key === 'Home') {
    return tabs[0];
  }
  else if (key === 'End') {
    return tabs[tabCount - 1];
  }
  else {
    return null;
  }
};

// EVENT LISTENERS

// Handle key presses.
window.addEventListener('keydown', event => {
  const key = event.key;
  // If no ineligible modifier key was in effect when the key was depressed:
  if (! (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)) {
    // Initialize the focused element.
    let focus = document.activeElement;
    // If it exists and is within the body:
    if (focus && focus !== document.body) {
      // If it is a tab:
      if (isTab(focus)) {
        // Identify the destination tab.
        const newFocus = destinationTab(focus, key);
        // If it differs from the currently focused element:
        if (newFocus && newFocus !== focus) {
          // Focus it.
          newFocus.focus();
        }
      }
    }
  }
});
// Handle tab focusing.
const documentTabs = Array.from(document.body.querySelectorAll('[role=tab]'));
documentTabs.forEach(tab => {
  tab.addEventListener('focus', () => {
    showPanel(tab);
    if (tab.tabIndex !== 0 || ! tab.classList.contains('active')) {
      makeActive(tab);
    }
  });
});
