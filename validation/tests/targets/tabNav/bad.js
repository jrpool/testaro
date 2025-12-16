/*
  © 2022–2023 CVS Health and/or one of its affiliates. All rights reserved.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  bad.js
  Script for validation/tests/targets/tabNav/bad.html.
*/

/*
  UTILITIES FOR EVENT HANDLERS
  Omits handlers for keydown events. Therefore, fails to handle arrow, Home, and End keydown events
  that standardly control the focus among tabs of a tab list.
*/

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
    tab.classList.remove('active');
  });
  button.classList.add('active');
};

// EVENT LISTENERS

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
