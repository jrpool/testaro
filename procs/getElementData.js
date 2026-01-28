/*
  © 2023–2024 CVS Health and/or one of its affiliates. All rights reserved.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

// Returns properties of an element with an excerpt when Testaro identifiers have been added.
exports.getElementData = async (page, excerpt) => {
  // Initialize the properties.
  let data = {
    tagName: '',
    id: '',
    text: '',
    notInDOM: true,
    boxID: '',
    pathID: '',
    originalExcerpt: excerpt,
  };
  let elementProperties = {};
  const testaroIDArray = excerpt.match(/data-testaro-id="(\d+)#([^"]*)"/);
  // If the excerpt contains a Testaro identifier:
  if (testaroIDArray) {
    // Remove the identifier.
    originalExcerpt = excerpt.replace(/ data-testaro-id="\d+#[^" ]+"?/, '');
    elementProperties = await page.evaluate(testaroIDArray => {
      let tagName = '';
      let id = '';
      const text = [];
      let notInDOM = false;
      let boxID = '';
      let pathID = '';
      const testaroID = `${testaroIDArray[1]}#${testaroIDArray[2]}`;
      const element = document.querySelector(`[data-testaro-id="${testaroID}"]`);
      // If any element has the identifier:
      if (element) {
        // Get properties of the element.
        ({tagName, id} = element);
        const segments = element
          .innerText
          ?.trim()
          .split(/[\t\n]+/)
          .filter(segment => segment.length);
        if (segments?.length) {
          if (segments.length > 1) {
            text.push(segments[0], segments[segments.length - 1]);
          }
          else {
            text.push(segments[0]);
          }
        }
        const boundingBox = element.getBoundingClientRect() ?? {};
        const box = {};
        if (boundingBox.x) {
          ['x', 'y', 'width', 'height'].forEach(coordinate => {
            box[coordinate] = Math.round(boundingBox[coordinate]);
          });
        }
        if (typeof box.x === 'number') {
          boxID = Object.values(box).join(':');
        }
        // Get a path ID from the identifier or, if necessary, the element.
        pathID = testaroIDArray[2];
        if (! pathID) {
          pathID = window.getXPath(element);
        }
      }
      // Otherwise, i.e. if no element has the identifier:
      else {
        // Report this.
        notInDOM = true;
      }
      // Report the properties.
      return {
        tagName,
        id,
        text,
        notInDOM,
        boxID,
        pathID
      };
    }, testaroIDArray);
    // Populate the data with any properties obtained from the element.
    Object.assign(data, elementProperties);
  }
  // Otherwise, i.e. if the excerpt contains no Testaro identifier:
  else {
    // Get properties of the element that are gettable from the excerpt.
    const tagNameArray = excerpt.match(/<([-a-z]+)/);
    data.tagName = tagNameArray?.[1] ?? '';
    const idArray = excerpt.match(/ id="([^"]*)"/);
    data.id = idArray?.[1] ?? '';
  }
  // Return the properties.
  return data;
};
// Returns a tag name and the value of an id attribute from a substring of HTML code.
exports.getIdentifiers = exports.getIdentifiers = code => {
  // Normalize the code.
  code = code.replace(/\s+/g, ' ').replace(/\\"/g, '"');
  // Get the first start tag of an element, if any.
  const startTagData = code.match(/^.*?<([a-zA-][^>]*)/);
  // If there is any:
  if (startTagData) {
    // Get the tag name.
    const tagNameArray = startTagData[1].match(/^[A-Za-z0-9]+/);
    const tagName = tagNameArray ? tagNameArray[0].toUpperCase() : '';
    // Get the value of the id attribute, if any.
    const identifierData = startTagData[1].match(/ id="([^"]+)"/);
    const id = identifierData ? identifierData[1] : '';
    // Return the tag name and the value of the id attribute, if any.
    return [tagName, id];
  }
  return ['', ''];
};
