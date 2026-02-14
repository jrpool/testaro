/*
  © 2023–2024 CVS Health and/or one of its affiliates. All rights reserved.
  © 2026 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  textNodes
  This test reports data about specified text nodes. Meanings of detailLevel values:
  0. Only total node count; no detail.
  1-3. Count of ancestry levels to provide data on (1 = text node, 2 = also parent, 3 = also grandparent)
*/

// FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (page, catalog, withItems, detailLevel, text = '') => {
  let data = {};
  // Get the data on the text nodes.
  try {
    data = await page.evaluate(args => {
      const detailLevel = args[0];
      const text = args[1];
      const matchNodes = [];
      // Collapse any adjacent text nodes.
      document.body.normalize();
      // Remove the irrelevant text content.
      const extraElements = Array.from(document.body.querySelectorAll('style, script, svg'));
      extraElements.forEach(element => {
        element.textContent = '';
      });
      // FUNCTION DEFINITIONS START
      // Compacts a string.
      const compact = string => string.replace(/\s+/g, ' ').trim();
      // Compacts and lower-cases a string.
      const toStandardString = string => compact(string).toLowerCase();
      /*
        Gets data (tagName, text if specified, attributes, refLabels, labels, and children)
        on an element.
      */
      const getElementData = (element, withText) => {
        // Initialize the data.
        const data = {
          tagName: element.tagName
        };
        if (! ['STYLE', 'SCRIPT', 'SVG', 'svg'].includes(element.tagName)) {
          if (withText) {
            data.text = compact(element.textContent);
          }
          // Add data on its attributes, if any, to the data.
          const {attributes} = element;
          if (attributes) {
            data.attributes = [];
            for (const attribute of attributes) {
              const {name, value} = attribute;
              data.attributes.push({
                name,
                value
              });
              // If any attribute is a labeler reference:
              if (name === 'aria-labelledby') {
                // Add the label texts to the data.
                const labelerIDs = value.split(/\s+/);
                data.refLabels = [];
                labelerIDs.forEach(id => {
                  const labeler = document.getElementById(id);
                  if (labeler) {
                    data.refLabels.push(compact(labeler.textContent));
                  }
                });
              }
            }
          }
          // Add data on its labels, if any, to the data.
          const {labels} = element;
          if (labels && labels.length) {
            data.labels = Array.from(labels).map(label => compact(label.textContent));
          }
          // Add data on its child elements, if any, to the data.
          if (element.childElementCount) {
            const children = Array.from(element.children);
            data.children = [];
            children.forEach(child => {
              data.children.push(getElementData(child, true));
            });
          }
        }
        return data;
      };
      // FUNCTION DEFINITIONS END
      const stdText = toStandardString(text);
      // Create a collection of the text nodes.
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      // Get their count.
      const data = {nodeCount: 0};
      let more = true;
      while(more) {
        if (walker.nextNode()) {
          const stdCurrent = toStandardString(walker.currentNode.nodeValue);
          if (stdCurrent.includes(stdText)) {
            data.nodeCount++;
            matchNodes.push(walker.currentNode);
          }
        }
        else {
          more = false;
        }
      }
      // If itemization is required:
      if (detailLevel > 0) {
        // Initialize the item data.
        data.items = [];
        // For each text node matching any specified text:
        matchNodes.forEach(node => {
          // Initialize the data on it.
          const itemData = {text: compact(node.nodeValue)};
          // If ancestral itemization is required:
          if (detailLevel > 1) {
            // Add the ancestral data, starting with the parent, to the item data.
            itemData.ancestors = [];
            let base = node;
            let currentLevel = 1;
            // For each specified ancestral distance:
            while(currentLevel++ < detailLevel) {
              // Add data on it to the data on the text node.
              const newBase = base.parentElement;
              // Omit the text of the text node if the ancestor is its parent.
              itemData.ancestors.push(getElementData(newBase, currentLevel > 2));
              base = newBase;
            }
          }
          // Add the node data to the itemization.
          data.items.push(itemData);
        });
      }
      return data;
    }, [detailLevel, text]);
  }
  catch(error) {
    console.log(`ERROR performing test (${error.message.replace(/\n.+/s, '')})`);
    data = {
      prevented: true,
      error: 'Test failed'
    };
  }
  // Return the result.
  return {
    data,
    totals: [],
    standardInstances: []
  };
};
