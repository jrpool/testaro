/*
  © 2023 CVS Health and/or one of its affiliates. All rights reserved.

  Licensed under the MIT License. See LICENSE file at the project root or   https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  elements
  This test reports data about specified elements within the document body. Meanings of detailLevel values:
  0. Only total element count; no detail.
  1. Also data on each specified element.
  2. Data on each specified element also include the text content of the parent element.
  3. Data on each specified element also include data on its sibling nodes.
*/
exports.reporter = async (
  page, withItems, detailLevel = 0, tagName = null, onlyVisible = false, attribute
) => {
  // Determine a selector of the specified elements, including any descendants of open shadow roots.
  let selector = `body ${tagName ? tagName.toLowerCase() : '*'}`;
  if (attribute) {
    selector += `[${attribute}]`;
  }
  if (onlyVisible) {
    selector += ':visible';
  }
  let data = {};
  // Get the data on the elements.
  try {
    const locator = page.locator(selector);
    data = await locator.evaluateAll((elements, detailLevel) => {
      // FUNCTION DEFINITIONS START
      // Compacts a string.
      const compact = string => string.replace(/\s+/g, ' ').trim();
      // Gets data on a sibling node of an element.
      const getSibInfo = (node, nodeType, text) => {
        const sibInfo = {
          type: nodeType
        };
        // If the sibling node is an element:
        if (nodeType === 1) {
          sibInfo.tagName = node.tagName;
          sibInfo.attributes = [];
          Array.from(node.attributes).forEach(attribute => {
            sibInfo.attributes.push({
              name: attribute.name,
              value: attribute.value
            });
          });
        }
        else if (nodeType === 3) {
          sibInfo.text = compact(text);
        }
        return sibInfo;
      };
      // FUNCTION DEFINITIONS END
      // Initialize the data with the count of the specified elements.
      const data = {
        total: elements.length
      };
      // If no itemization is required:
      if (detailLevel === 0) {
        // Return the element count.
        return data;
      }
      // Otherwise, i.e. if itemization is required:
      else {
        // Initialize the item data.
        data.items = [];
        // For each specified element:
        elements.forEach(element => {
          // Initialize data on it.
          const parent = element.parentElement;
          const datum = {
            tagName: element.tagName,
            parentTagName: parent ? parent.tagName : '',
            code: compact(element.outerHTML),
            attributes: [],
            textContent: compact(element.textContent)
          };
          // For each of its attributes:
          for (const attribute of element.attributes) {
            // Add data on the attribute to the element data.
            const {name, value} = attribute;
            datum.attributes.push({
              name,
              value
            });
            // If the element has reference labels:
            if (name === 'aria-labelledby') {
              // Add their texts to the element data.
              const labelerIDs = value.split(/\s+/);
              const labelers = [];
              labelerIDs.forEach(id => {
                const labeler = document.getElementById(id);
                if (labeler) {
                  labelers.push(compact(labeler.textContent));
                }
              });
              if (labelers.length) {
                datum.labelers = labelers;
              }
            }
          }
          // If the element has text content:
          const {labels, textContent} = element;
          const compactContent = compact(textContent);
          if (compactContent) {
            // Add it to the element data.
            datum.textContent = compactContent;
          }
          // If the element has labels:
          if (labels && labels.length) {
            // Add their texts to the element data.
            datum.labels = Array.from(labels).map(label => compact(label.textContent));
          }
          // If the parental text content is required:
          if (detailLevel > 1) {
            // Add it (excluding any shadow-root descendants) to the element data.
            datum.parentTextContent = parent ? compact(parent.textContent) : '';
          }
          // If sibling itemization is required:
          if (detailLevel === 3) {
            // Add data on the siblings, excluding any descendants of shadow roots, to the data.
            datum.siblings = {
              before: [],
              after: []
            };
            let more = element;
            while (more) {
              more = more.previousSibling;
              if (more) {
                const {nodeType, nodeValue} = more;
                if (! (nodeType === 3 && nodeValue === '')) {
                  const sibInfo = getSibInfo(more, nodeType, nodeValue);
                  datum.siblings.before.unshift(sibInfo);
                }
              }
            }
            more = element;
            while (more) {
              more = more.nextSibling;
              if (more) {
                const {nodeType, textContent} = more;
                if (! (nodeType === 3 && textContent === '')) {
                  const sibInfo = getSibInfo(more, nodeType, compact(textContent));
                  datum.siblings.after.push(sibInfo);
                }
              }
            }
          }
          data.items.push(datum);
        });
        return data;
      }
    }, detailLevel);
  }
  catch(error) {
    console.log(`ERROR performing test (${error.message})`);
    data = {
      prevented: true,
      error: 'ERROR performing test'
    };
  }
  // Return the result.
  return {
    data,
    totals: [],
    standardInstances: []
  };
};
