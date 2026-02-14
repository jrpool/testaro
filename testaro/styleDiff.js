/*
  © 2021–2024 CVS Health and/or one of its affiliates. All rights reserved.
  © 2026 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  styleDiff
  This test reports style differences among links, buttons, and headings. It assumes that an accessible page employs few or only one style for adjacent links, and likewise for list links, buttons, and headings at each level. The test considers only particular style properties, listed in the 'mainStyles' and 'headingStyles' arrays.
*/

// FUNCTIONS

// Returns an object classifying the links in a page by layout.
const linksByType = async page => await page.evaluateHandle(() => {
  // FUNCTION DEFINITIONS START
  // Removes spacing characters from a text.
  const despace = text => text.replace(/\s/g, '');
  // Returns whether a list is a list entirely of links.
  const isLinkList = list => {
    const listItems = Array.from(list.children);
    if (listItems.length > 1) {
      return listItems.length > 1 && listItems.every(item => {
        if (item.tagName === 'LI') {
          const {children} = item;
          if (children.length === 1) {
            const link = children[0];
            if (link.tagName === 'A') {
              const itemText = despace(item.textContent);
              const linkText = despace(link.textContent);
              return itemText.length === linkText.length;
            }
            else {
              return false;
            }
          }
          else {
            return false;
          }
        }
        else {
          return false;
        }
      });
    }
    else {
      return false;
    }
  };
  // FUNCTION DEFINITIONS END
  // Identify the lists in the page.
  const lists = Array.from(document.body.querySelectorAll('ul, ol'));
  // Initialize an array of list links.
  const listLinks = [];
  // For each one:
  lists.forEach(list => {
    // If it is a list of links:
    if (isLinkList(list)) {
      // Choose one of the links randomly, assuming they have uniform styles.
      const links = Array.from(list.querySelectorAll('a'));
      const randomIndex = Math.floor(Math.random() * links.length);
      const randomLink = links[randomIndex];
      // Add it to the array.
      listLinks.push(randomLink);
    }
  });
  // Identify the inline links in the page.
  const allLinks = Array.from(document.body.querySelectorAll('a'));
  const inlineLinks = allLinks.filter(link => ! listLinks.includes(link));
  // Return the data.
  return {
    adjacent: inlineLinks,
    list: listLinks
  };
});
// Runs the test and returns the result.
exports.reporter = async (page, catalog, withItems) => {
  // Get an object with arrays of list links and adjacent links as properties.
  const linkTypes = await linksByType(page);
  return await page.evaluate(args => {
    const linkTypes = args[0];
    const withItems = args[1];
    const {body} = document;
    // Identify the settable style properties to be compared for all tag names.
    const mainStyles = [
      'fontStyle',
      'fontWeight',
      'opacity',
      'textDecorationLine',
      'textDecorationStyle',
      'textDecorationThickness'
    ];
    // Identify those only for buttons.
    const buttonStyles = [
      'borderStyle',
      'borderWidth',
      'height',
      'lineHeight',
      'maxHeight',
      'maxWidth',
      'minHeight',
      'minWidth',
      'outlineOffset',
      'outlineStyle',
      'outlineWidth'
    ];
    // Identify those for headings.
    const headingStyles = [
      'color',
      'fontSize'
    ];
    // Identify those for list links.
    const listLinkStyles = [
      'color',
      'fontSize',
      'lineHeight'
    ];
    // Initialize the data to be returned.
    const data = {
      mainStyles,
      buttonStyles,
      headingStyles,
      listLinkStyles,
      totals: {}
    };
    if (withItems) {
      data.items = {};
    }
    // Initialize an object of elements to be analyzed, including links.
    const elements = {
      buttons: [],
      headings: {
        h1: [],
        h2: [],
        h3: [],
        h4: [],
        h5: [],
        h6: []
      },
      links: {
        adjacent: linkTypes.adjacent,
        list: linkTypes.list
      }
    };
    // Identify the heading tag names to be analyzed.
    const headingNames = Object.keys(elements.headings);
    // Add the buttons to the object.
    elements.buttons = Array.from(body.querySelectorAll('button, input[type=button]'));
    // For each heading tag name:
    headingNames.forEach(tagName => {
      // Add its elements to the object.
      elements.headings[tagName] = Array.from(body.getElementsByTagName(tagName));
    });
    // FUNCTION DEFINITION START
    // Tabulates the distribution of style properties for elements of a type.
    const tallyStyles = (typeName, elements, typeStyles, withItems) => {
      // If there are any elements:
      const elementCount = elements.length;
      if (elementCount) {
        const styleProps = {};
        const styleTexts = {};
        // For each element:
        elements.forEach(element => {
          // Get its values on the style properties to be compared.
          const styleDec = window.getComputedStyle(element);
          const style = {};
          const styles = mainStyles.concat(typeStyles);
          styles.forEach(styleName => {
            style[styleName] = styleDec[styleName];
          });
          // Get a text representation of the style, limited to those properties.
          const styleText = JSON.stringify(style);
          // Increment the total of elements with that style.
          styleTexts[styleText] = ++styleTexts[styleText] || 1;
          // If details are to be reported:
          if (withItems) {
            // Add the element’s values and text to the style details.
            if (! styleProps[typeName]) {
              styleProps[typeName] = {};
            }
            const elementText = (element.textContent.trim() || element.outerHTML.trim())
            .replace(/\s+/g, ' ')
            .slice(0, 100);
            // For each style property being compared:
            styles.forEach(styleName => {
              if (! styleProps[typeName][styleName]) {
                styleProps[typeName][styleName] = {};
              }
              if (! styleProps[typeName][styleName][style[styleName]]) {
                styleProps[typeName][styleName][style[styleName]] = [];
              }
              // Add the element text to the style details.
              styleProps[typeName][styleName][style[styleName]].push(elementText);
            });
          }
        });
        // Add the total to the result.
        data.totals[typeName] = {total: elementCount};
        const styleCounts = Object.values(styleTexts);
        // If the elements of the type differ in style:
        if (styleCounts.length > 1) {
          // Add the distribution of its style counts to the result.
          data.totals[typeName].subtotals = styleCounts.sort((a, b) => b - a);
          // If details are to be reported:
          if (withItems) {
            // Delete the data on uniform style properties.
            Object.keys(styleProps[typeName]).forEach(styleName => {
              if (Object.keys(styleProps[typeName][styleName]).length === 1) {
                delete styleProps[typeName][styleName];
              }
            });
            // Add the element values and texts to the result.
            data.items[typeName] = styleProps[typeName];
          }
        }
      }
    };
    // FUNCTION DEFINITION END
    // Report the style-property distributions for the element types.
    tallyStyles('button', elements.buttons, buttonStyles, withItems);
    tallyStyles('adjacentLink', elements.links.adjacent, [], withItems);
    tallyStyles('listLink', elements.links.list, listLinkStyles, withItems);
    headingNames.forEach(headingName => {
      tallyStyles(headingName, elements.headings[headingName], headingStyles, withItems);
    });
    // Report the standandardized data.
    const totals = [0, 0, 0, 0];
    const standardInstances = [];
    const elementData = {
      adjacentLink: [0, 'In-line links', 'A'],
      listLink: [1, 'Links in columns', 'A'],
      button: [2, 'Buttons', 'BUTTON'],
      h1: [3, 'Level-1 headings', 'H1'],
      h2: [3, 'Level-2 headings', 'H2'],
      h3: [3, 'Level-3 headings', 'H3'],
      h4: [3, 'Level-4 headings', 'H4'],
      h5: [3, 'Level-5 headings', 'H5'],
      h6: [3, 'Level-6 headings', 'H6'],
    };
    // For each eligible element type:
    Object.keys(elementData).forEach(elementName => {
      // If it has more than 1 style:
      const elementTotal = data.totals[elementName];
      if (elementTotal && elementTotal.subtotals) {
        const currentData = elementData[elementName];
        const severity = currentData[0];
        const elementSubtotals = elementTotal.subtotals;
        // Treat the count of its styles in excess of 1 as the instance count for that element type.
        const extraCount = elementSubtotals.length - 1;
        totals[severity] += extraCount;
        // Add a summary standard instance for that element type.
        standardInstances.push({
          ruleID: 'styleDiff',
          what: `${currentData[1]} have ${elementSubtotals.length} different styles`,
          ordinalSeverity: severity,
          count: extraCount
        });
      }
    });
    // Return the result.
    return {
      data,
      totals,
      standardInstances
    };
  }, [linkTypes, withItems]);
};
