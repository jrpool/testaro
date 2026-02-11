/*
  © 2021–2024 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  tabNav
  This test reports nonstandard keyboard navigation among tab elements in visible tab lists. Standards are based on https://www.w3.org/TR/wai-aria-practices-1.1/#tabpanel.
*/

// IMPORTS

import {getXPathCatalogIndex} from '../procs/xPath';

// CONSTANTS

const data = {};

// FUNCTIONS

// Returns the index of the focused tab in an array of tabs.
const focusedTab = async (tabs, page) => await page.evaluate(tabs => {
  const focus = document.activeElement;
  return tabs.indexOf(focus);
}, tabs)
.catch(error => {
  console.log(`ERROR: could not find focused tab (${error.message})`);
  return -1;
});
// Tests a navigation on a focused tab element.
const testKey = async (
  tabs, tabElement, keyName, keyProp, goodIndex, elementIsCorrect, itemData, withItems, page
) => {
  let pressed = true;
  // Click the tab element, to make the focus on it effective.
  await tabElement.click({
    timeout: 500
  })
  .catch(async error => {
    console.log(
      `ERROR clicking tab element ${itemData.text} (${error.message.replace(/\n.+/s, '')})`
    );
    await tabElement.click({
      force: true
    });
  })
  .catch(error => {
    console.log(
      `ERROR force-clicking tab element ${itemData.text} (${error.message.replace(/\n.+/s, '')})`
    );
    pressed = false;
  });
  // Increment the counts of navigations and key navigations.
  data.totals.navigations.all.total++;
  data.totals.navigations.specific[keyProp].total++;
  const {navigationErrors} = itemData;
  // If the click succeeded:
  if (pressed) {
    // Refocus the tab element and press the specified key (page.keyboard.press may fail).
    await tabElement.press(keyName, {
      timeout: 1000
    })
    .catch(error => {
      console.log(`ERROR: could not press ${keyName} (${error.message})`);
      pressed = false;
    });
    // If the refocus and keypress succeeded:
    if (pressed) {
      // Identify which tab element is now focused, if any.
      const focusIndex = await focusedTab(tabs, page);
      // If the focus is correct:
      if (focusIndex === goodIndex) {
        // Increment the counts of correct navigations and correct key navigations.
        data.totals.navigations.all.correct++;
        data.totals.navigations.specific[keyProp].correct++;
      }
      // Otherwise, i.e. if the focus is incorrect:
      else {
        // Increment the counts of incorrect navigations and incorrect key navigations.
        data.totals.navigations.all.incorrect++;
        data.totals.navigations.specific[keyProp].incorrect++;
        // Update the element status to incorrect.
        elementIsCorrect = false;
        // If itemization is required:
        if (withItems) {
          // Update the element report.
          navigationErrors.push(keyName);
        }
      }
      return elementIsCorrect;
    }
    // Otherwise, i.e. if the refocus or keypress failed:
    else {
      // Increment the counts of incorrect navigations and incorrect key navigations.
      data.totals.navigations.all.incorrect++;
      data.totals.navigations.specific[keyProp].incorrect++;
      // If itemization is required and a focus failure has not yet been reported:
      if (withItems && ! navigationErrors.includes('focus')) {
        // Update the element report.
        navigationErrors.push('focus');
      }
      return false;
    }
  }
  // Otherwise, i.e. if the click failed:
  else {
    // Increment the counts of incorrect navigations and incorrect key navigations.
    data.totals.navigations.all.incorrect++;
    data.totals.navigations.specific[keyProp].incorrect++;
    // If itemization is required and a click failure has not yet been reported:
    if (withItems && ! navigationErrors.includes('click')) {
      // Update the element report.
      navigationErrors.push('click');
    }
    return false;
  }
};
// Returns the index to which an arrow key should move the focus.
const arrowTarget = (startIndex, tabCount, orientation, direction) => {
  if (orientation === 'horizontal') {
    if (['up', 'down'].includes(direction)) {
      return startIndex;
    }
    else if (direction === 'left') {
      return startIndex ? startIndex - 1 : tabCount - 1;
    }
    else if (direction === 'right') {
      return startIndex === tabCount - 1 ? 0 : startIndex + 1;
    }
  }
  else if (orientation === 'vertical') {
    if (['left', 'right'].includes(direction)) {
      return startIndex;
    }
    else if (direction === 'up') {
      return startIndex ? startIndex - 1 : tabCount - 1;
    }
    else if (direction === 'down') {
      return startIndex === tabCount - 1 ? 0 : startIndex + 1;
    }
  }
};
/*
  Recursively tests tablist tab elements (per
  https://www.w3.org/TR/wai-aria-practices-1.1/#tabpanel)
*/
const testTabs = async (tabs, index, listOrientation, listIsCorrect, withItems, page) => {
  const tabCount = tabs.length;
  // If any tab elements remain to be tested:
  if (index < tabCount) {
    // Increment the reported count of tab elements.
    data.totals.tabElements.total++;
    // Identify the tab element to be tested.
    const currentTab = tabs[index];
    // Initialize it as correct.
    let isCorrect = true;
    const itemData = {};
    // If itemization is required:
    if (withItems) {
      // Initialize a report on the element.
      itemData.xPath = await page.evaluate(element => window.getXPath(element));
      itemData.navigationErrors = [];
    }
    // Test the element with each navigation key.
    isCorrect = await testKey(
      tabs,
      currentTab,
      'Tab',
      'tab',
      -1,
      isCorrect,
      itemData,
      withItems,
      page
    );
    isCorrect = await testKey(
      tabs,
      currentTab,
      'ArrowLeft',
      'left',
      arrowTarget(index, tabCount, listOrientation, 'left'),
      isCorrect,
      itemData,
      withItems,
      page
    );
    isCorrect = await testKey(
      tabs,
      currentTab,
      'ArrowRight',
      'right',
      arrowTarget(index, tabCount, listOrientation, 'right'),
      isCorrect,
      itemData,
      withItems,
      page
    );
    isCorrect = await testKey(
      tabs,
      currentTab,
      'ArrowUp',
      'up',
      arrowTarget(index, tabCount, listOrientation, 'up'),
      isCorrect,
      itemData,
      withItems,
      page
    );
    isCorrect = await testKey(
      tabs,
      currentTab,
      'ArrowDown',
      'down',
      arrowTarget(index, tabCount, listOrientation, 'down'),
      isCorrect,
      itemData,
      withItems,
      page
    );
    isCorrect = await testKey(
      tabs,
      currentTab,
      'Home',
      'home',
      0,
      isCorrect,
      itemData,
      withItems,
      page
    );
    isCorrect = await testKey(
      tabs, currentTab, 'End', 'end', tabCount - 1, isCorrect, itemData, withItems, page
    );
    // Update the tablist status (Node 14 does not support the ES 2021 &&= operator).
    listIsCorrect = listIsCorrect && isCorrect;
    // Increment the data.
    data.totals.tabElements[isCorrect ? 'correct' : 'incorrect']++;
    if (withItems) {
      data.tabElements[isCorrect ? 'correct' : 'incorrect'].push(itemData);
    }
    // Process the next tab element.
    return await testTabs(tabs, index + 1, listOrientation, listIsCorrect, withItems, page);
  }
  // Otherwise, i.e. if all tab elements have been tested:
  else {
    // Return whether the tablist is correct.
    return listIsCorrect;
  }
};
// Recursively tests tablists.
const testTabLists = async (tabLists, withItems, page) => {
  // If any tablists remain to be tested:
  if (tabLists.length) {
    const firstTabList = tabLists[0];
    let orientation = await firstTabList.getAttribute('aria-orientation')
    .catch(error=> {
      console.log(`ERROR: could not get tab-list orientation (${error.message})`);
      return 'ERROR';
    });
    if (! orientation) {
      orientation = 'horizontal';
    }
    if (orientation === 'ERROR') {
      data.prevented = true;
    }
    else {
      const tabs = await firstTabList.$$('[role=tab]');
      // If the tablist contains at least 2 tab elements:
      if (tabs.length > 1) {
        // Test them.
        const isCorrect = await testTabs(tabs, 0, orientation, true, withItems, page);
        // Increment the data.
        data.totals.tabLists.total++;
        data.totals.tabLists[isCorrect ? 'correct' : 'incorrect']++;
        // Process the remaining tablists.
        await testTabLists(tabLists.slice(1), withItems, page);
      }
    }
  }
};
// Runs the test and returns the result.
exports.reporter = async (page, catalog, withItems) => {
  // Initialize the results.
  data.totals = {
    navigations: {
      all: {
        total: 0,
        correct: 0,
        incorrect: 0
      },
      specific: {
        tab: {
          total: 0,
          correct: 0,
          incorrect: 0
        },
        left: {
          total: 0,
          correct: 0,
          incorrect: 0
        },
        right: {
          total: 0,
          correct: 0,
          incorrect: 0
        },
        up: {
          total: 0,
          correct: 0,
          incorrect: 0
        },
        down: {
          total: 0,
          correct: 0,
          incorrect: 0
        },
        home: {
          total: 0,
          correct: 0,
          incorrect: 0
        },
        end: {
          total: 0,
          correct: 0,
          incorrect: 0
        }
      }
    },
    tabElements: {
      total: 0,
      correct: 0,
      incorrect: 0
    },
    tabLists: {
      total: 0,
      correct: 0,
      incorrect: 0
    }
  };
  if (withItems) {
    data.tabElements = {
      incorrect: [],
      correct: []
    };
  }
  // Get an array of element handles for the visible tablists.
  const tabLists = await page.$$('[role=tablist]:visible');
  if (tabLists.length) {
    await testTabLists(tabLists, withItems, page);
  }
  // Get the totals of navigation errors, bad tabs, and bad tab lists.
  const totals = data.totals ? [
    data.totals.navigations.all.incorrect,
    data.totals.tabElements.incorrect,
    data.totals.tabLists.incorrect,
    0
  ] : [];
  // Initialize the standard instances.
  const standardInstances = [];
  // If itemization is required:
  if (withItems) {
    // For each bad tab:
    data.tabElements.incorrect.forEach(item => {
      // Create a proto-instance.
      const protoInstance = {
        ruleID: 'tabNav',
        what: `Tab responds nonstandardly to ${item.navigationErrors.join(', ')}`,
        ordinalSeverity: 1,
        count: 1
      };
      // Try to get a catalog index from the xPath of the tab.
      const catalogIndex = getXPathCatalogIndex(catalog, item.xPath);
      // If the acquisition succeeded:
      if (catalogIndex) {
        // Add the catalog index to the proto-instance.
        protoInstance.catalogIndex = catalogIndex;
      }
      // Otherwise, i.e. if the acquisition failed:
      else {
        // Add the XPath to the proto-instance as a path ID.
        protoInstance.pathID = item.xPath;
      }
      // Add the proto-instance to the standard instances.
      standardInstances.push(protoInstance);
    });
  }
  // Otherwise, if navigation is not required and any navigations were bad:
  else if (data.totals.navigations.all.incorrect) {
    // Create a standard instance.
    standardInstances.push({
      ruleID: 'tabNav',
      what: 'Tab lists have nonstandard navigation',
      ordinalSeverity: 1,
      count: data.totals.navigations.all.incorrect
    });
  }
  // Return the result.
  return {
    data,
    totals,
    standardInstances
  };
};
