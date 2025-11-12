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
  tabNav
  This test reports nonstandard keyboard navigation among tab elements in visible tab lists.
  Standards are based on https://www.w3.org/TR/wai-aria-practices-1.1/#tabpanel.
*/

// CONSTANTS

const data = {};

// FUNCTIONS

// Returns the text associated with an element.
const allText = async (page, elementHandle) => await page.evaluate(element => {
  // Identify the element, if specified, or else the focused element.
  const el = element || document.activeElement;
  // Initialize an array of its texts.
  const texts = [];
  // FUNCTION DEFINITION START
  // Removes excess spacing from a string.
  const debloat = text => text.trim().replace(/\s+/g, ' ');
  // FUNCTION DEFINITION END
  // Add any attribute label to the array.
  const ariaLabel = el.getAttribute('aria-label');
  if (ariaLabel) {
    const trimmedLabel = debloat(ariaLabel);
    if (trimmedLabel) {
      texts.push(trimmedLabel);
    }
  }
  // Add any explicit and implicit labels to the array.
  const labelNodeList = el.labels;
  if (labelNodeList && labelNodeList.length) {
    const labels = Array.from(labelNodeList);
    const labelTexts = labels
    .map(label => label.textContent && debloat(label.textContent))
    .filter(text => text);
    if (labelTexts.length) {
      texts.push(...labelTexts);
    }
  }
  // Add any referenced labels to the array.
  if (el.hasAttribute('aria-labelledby')) {
    const labelerIDs = el.getAttribute('aria-labelledby').split(/\s+/);
    labelerIDs.forEach(id => {
      const labeler = document.getElementById(id);
      if (labeler) {
        const labelerText = debloat(labeler.textContent);
        if (labelerText) {
          texts.push(labelerText);
        }
      }
    });
  }
  // Add any image text alternatives to the array.
  const altTexts = Array
  .from(element.querySelectorAll('img[alt]:not([alt=""])'))
  .map(img => debloat(img.alt))
  .join('; ');
  if (altTexts.length) {
    texts.push(altTexts);
  }
  // Add the first 100 characters of any text content of the element to the array.
  const ownText = element.textContent;
  if (ownText) {
    const minText = debloat(ownText);
    if (minText) {
      texts.push(minText.slice(0, 100));
    }
  }
  // Add any ID of the element to the array.
  const id = element.id;
  if (id) {
    texts.push(`#${id}`);
  }
  // Identify a concatenation of the texts.
  let textChain = texts.join('; ');
  // If it is empty:
  if (! textChain) {
    // Substitute the HTML of the element.
    textChain = `{${debloat(element.outerHTML)}}`;
    if (textChain === '{}') {
      textChain = '';
    }
  }
  // Return a concatenation of the texts in the array.
  return textChain;
}, elementHandle);
// Returns the index of the focused tab in an array of tabs.
const focusedTab = async (tabs, page) => await page.evaluate(tabs => {
  const focus = document.activeElement;
  return tabs.indexOf(focus);
}, tabs)
.catch(error => {
  console.log(`ERROR: could not find focused tab (${error.message})`);
  return -1;
});
// Tests a navigation on a tab element.
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
      let found = true;
      // Initialize a report on the element.
      const moreItemData = await page.evaluate(element => ({
        tagName: element.tagName,
        id: element.id
      }), currentTab)
      .catch(error => {
        console.log(`ERROR: could not get tag name (${error.message})`);
        found = false;
        data.prevented = true;
        return 'ERROR: not found';
      });
      if (found) {
        itemData.tagName = moreItemData.tagName;
        itemData.id = moreItemData.id;
        itemData.text = await allText(page, currentTab);
        itemData.navigationErrors = [];
      }
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
// Tests tab-list navigation and reports results.
exports.reporter = async (page, withItems) => {
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
      // Create a standard instance.
      standardInstances.push({
        ruleID: 'tabNav',
        what: `Tab responds nonstandardly to ${item.navigationErrors.join(', ')}`,
        ordinalSeverity: 1,
        tagName: item.tagName,
        id: item.id,
        location: {
          doc: '',
          type: '',
          spec: ''
        },
        excerpt: item.text
      });
    });
  }
  // Otherwise, if navigation is not required and any navigations are bad:
  else if (data.totals.navigations.all.incorrect) {
    // Create a standard instance.
    standardInstances.push({
      ruleID: 'tabNav',
      what: 'Tab lists have nonstandard navigation',
      ordinalSeverity: 1,
      count: data.totals.navigations.all.incorrect,
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
  // Return the result.
  return {
    data,
    totals,
    standardInstances
  };
};
