/*
  © 2023–2024 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  buttonMenu
  This test reports nonstandard navigation among menu items of button-controlled menus. Standards are based on https://www.w3.org/TR/wai-aria-practices-1.1/#menu. The trialKeys argument is an array of strings, each of which may be 'Home', 'End', '+', or '-'. The '+' string represents the ArrowDown or ArrowRight key, and the '-' string represents the ArrowUp or ArrowLeft key, depending on the orientation of the current menu. When the trialKeys argument is missing or is an empty array, 12 keys are selected at random.
*/

// ########## IMPORTS

// Module to get locator data.
const {getLocatorData} = require('../procs/getLocatorData');

// ########## FUNCTIONS

// Returns an adjacent index, with wrapping.
const getAdjacentIndexWithWrap = (groupSize, startIndex, increment) => {
  let newIndex = startIndex + increment;
  if (newIndex < 0) {
    newIndex = groupSize - 1;
  }
  else if (newIndex > groupSize - 1) {
    newIndex = 0;
  }
  return newIndex;
};
// Returns whether a key created the expected effective focus.
const focusSuccess = async (miLocsDir, priorIndex, key, isPseudo) => {
  // Initialize the result.
  const result = {
    isOK: false,
    newFocIndex: null
  };
  // For each of the menu items directly descending from the menu:
  for (const miLocDir of miLocsDir) {
    // Get whether it is effectively focused.
    const hasFocus = await miLocDir.evaluate((el, isPseudo) => {
      if (isPseudo) {
        const effectiveID = document.activeElement.getAttribute('aria-activeDescendant');
        if (effectiveID) {
          const effectiveEl = document.getElementById(effectiveID);
          return effectiveEl === el;
        }
        else {
          return false;
        }
      }
      else {
        return document.activeElement === el;
      }
    }, isPseudo);
    // If it is:
    if (hasFocus) {
      // Get whether the effective focus is as expected and update the result.
      const miFocIndex = miLocsDir.indexOf(miLocDir);
      const miCount = miLocsDir.length;
      if (key === 'Home' && miFocIndex === 0) {
        result.isOK = true;
        result.newFocIndex = 0;
      }
      else if (key === 'End' && miFocIndex === miCount - 1) {
        result.isOK = true;
        result.newFocIndex = miCount - 1;
      }
      else if (['ArrowLeft', 'ArrowUp'].includes(key)) {
        const expectedIndex = getAdjacentIndexWithWrap(miCount, priorIndex, -1);
        if (miFocIndex === expectedIndex) {
          result.isOK = true;
          result.newFocIndex = expectedIndex;
        }
      }
      else if (['ArrowRight', 'ArrowDown'].includes(key)) {
        const expectedIndex = getAdjacentIndexWithWrap(miCount, priorIndex, 1);
        if (miFocIndex === expectedIndex) {
          result.isOK = true;
          result.newFocIndex = expectedIndex;
        }
      }
      break;
    }
  }
  // Return the result.
  return result;
};
// Performs the test and reports the result.
exports.reporter = async (page, catalog, withItems, trialKeySpecs = []) => {
  // Initialize the result.
  const data = {};
  const totals = [0, 0, 0, 0];
  const standardInstances = [];
  // Get locators for all menu buttons.
  const mbLocAll = page.locator(
    'button[aria-controls][aria-expanded][aria-haspopup=true], button[aria-controls][aria-expanded][aria-haspopup=menu]'
  );
  // For each menu button:
  const mbLocsAll = await mbLocAll.all();
  for (const mbLoc of mbLocsAll) {
    // Get a locator for its menu.
    const menuID = await mbLoc.getAttribute('aria-controls');
    const menuLoc = page.locator(`[id=${menuID}][role=menu], [id=${menuID}][role=menubar]`);
    // If the button controls exactly 1 menu:
    if (menuLoc && await menuLoc.count() === 1) {
      // Get data on the menu.
      const elData = await getLocatorData(menuLoc);
      // If data were obtained:
      if (elData) {
        // Get the orientation and focus-management type of the menu.
        const extraData = await menuLoc.evaluate(element => {
          const extraData = {};
          let orientation = element.getAttribute('aria-orientation');
          if (! orientation) {
            const role = element.getAttribute('role');
            if (role === 'menubar') {
              orientation = 'horizontal';
            }
            else if (role === 'menu') {
              orientation = 'vertical';
            }
            else {
              orientation = null;
            }
          }
          extraData.orientation = orientation;
          const isPseudo = !! element.getAttribute('aria-activedescendant');
          extraData.isPseudo = isPseudo;
          return extraData;
        });
        // If they were obtained:
        if (extraData) {
          // Get locators for its descendant non-menu menu items.
          const miLocAll = menuLoc.locator('[role=menuitem]:not([role=menu], [role=menubar])');
          // Get which of them are direct descendants.
          const areDirect = await miLocAll.evaluateAll((els, menuID) => {
            return els.map(el => {
              const itsMenu = el.closest('[role=menu], [role=menubar]');
              return itsMenu.id && itsMenu.id === menuID;
            });
          }, menuID);
          const miLocsAll = await miLocAll.all();
          const miLocsDir = miLocsAll.filter((loc, index) => areDirect[index]);
          // If there are at least 2 of them:
          if (miLocsDir.length > 1) {
            // Ensure that the menu is collapsed.
            await menuLoc.evaluate(element => {
              element.setAttribute('aria-expanded', false);
            });
            // Focus the menu button and press the key that opens its menu from the top.
            await mbLoc.press(extraData.orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown');
            // If trial keys have been specified:
            const trialKeys = [];
            if (trialKeySpecs.length) {
              // Implement them.
              trialKeySpecs.forEach(spec => {
                if (['Home', 'End'].includes(spec)) {
                  trialKeys.push(spec);
                }
                else if (spec === '-') {
                  trialKeys.push(extraData.orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp');
                }
                else if (spec === '+') {
                  trialKeys.push(
                    extraData.orientation === 'horizontal' ? 'ArrowtRight' : 'ArrowDown'
                  );
                }
              });
            }
            // Otherwise, i.e. if trial keys have not been specified:
            else {
              // Randomly draw 12 keys from Home, End, and the applicable arrow keys.
              const keys = ['Home', 'End'];
              if (extraData.orientation === 'horizontal') {
                keys.push('ArrowLeft', 'ArrowRight');
              }
              else {
                keys.push('ArrowUp', 'ArrowDown');
              }
              let trialKeyCount = 0;
              while (trialKeyCount++ < 12) {
                trialKeys.push(keys[Math.floor(4 * Math.random())]);
              }
            }
            // Add the list of trial keys to the result.
            data.trialKeys = trialKeys;
            let focIndex = 0;
            // For each key in the trial:
            for (const key of trialKeys) {
              // Press it.
              await page.keyboard.press(key);
              // Get whether the expected focus occurred.
              const focData = await focusSuccess(miLocsDir, focIndex, key, extraData.isPseudo);
              // If so:
              if (focData.isOK) {
                // Update the index of the effective focus.
                focIndex = focData.newFocIndex;
              }
              // Otherwise, i.e. if the expected focus did not occur:
              else {
                // Add to the totals.
                totals[2]++;
                // If itemization is required:
                if (withItems) {
                  // Add an instance to the result.
                  standardInstances.push({
                    ruleID: 'buttonMenu',
                    what: `Menu responds nonstandardly to the ${key} key`,
                    ordinalSeverity: 2,
                    tagName: elData.tagName,
                    id: elData.id,
                    location: elData.location,
                    excerpt: elData.excerpt
                  });
                }
                break;
              }
            }
          }
        }
        // Otherwise, i.e. if the orientation and focus-management type were not obtained:
        else {
          // Report this.
          console.log('ERROR: Menu orientation and focus-management type not obtained');
        }
      }
      // Otherwise, i.e. if the data were not obtained:
      else {
        // Report this.
        console.log('ERROR: Menu data not obtained');
      }
    }
    // Otherwise, i.e. if it does not control exactly 1 menu:
    else {
      // Add to the totals.
      totals[2]++;
      // If itemization is required:
      if (withItems) {
        // Get data on the menu button.
        const mbData = await getLocatorData(mbLoc);
        // Add an instance to the result.
        standardInstances.push({
          ruleID: 'buttonMenu',
          what: `Menu button does not control exactly 1 menu`,
          ordinalSeverity: 2,
          tagName: 'BUTTON',
          id: await mbData.id,
          location: mbData.location,
          excerpt: mbData.excerpt
        });
      }
    }
  }
  // If itemization is not required and there are any instances:
  if (! withItems && totals[2]) {
    // Add a summary instance to the result.
    standardInstances.push({
      ruleID: 'buttonMenu',
      what: 'Menu buttons and menus behave nonstandardly',
      count: totals[2],
      ordinalSeverity: 2,
      tagName: '',
      id: '',
      location: {
        doc: '',
        type: '',
        spec: ''
      },
      excerpt: ''
    });
  }
  return {
    data,
    totals,
    standardInstances
  };
};
