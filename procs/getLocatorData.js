/*
  © 2023–2024 CVS Health and/or one of its affiliates. All rights reserved.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  getLocatorData
  Returns data about the element identified by a locator.
*/
exports.getLocatorData = async loc => {
  const locCount = await loc.count();
  // If the locator identifies exactly 1 element:
  if (locCount === 1) {
    // Get the facts obtainable from the browser.
    const data = await loc.evaluate(element => {
      // Tag name.
      const tagName = element.tagName;
      // ID.
      const id = element.id || '';
      // Texts.
      const {textContent} = element;
      const alts = Array.from(element.querySelectorAll('img[alt]:not([alt=""])'));
      const altTexts = alts.map(alt => alt.getAttribute('alt'));
      const altsText = altTexts.join(' ');
      const ariaLabelText = element.ariaLabel || '';
      const refLabelID = element.getAttribute('aria-labelledby');
      const refLabel = refLabelID ? document.getElementById(refLabelID) : '';
      const refLabelText = refLabel ? refLabel.textContent : '';
      let labelsText = '';
      if (tagName === 'INPUT') {
        const labels = element.labels || [];
        const labelTexts = [];
        labels.forEach(label => {
          labelTexts.push(label.textContent);
        });
        labelsText = labelTexts.join(' ');
      }
      let text = [textContent, altsText, ariaLabelText, refLabelText, labelsText]
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
      if (! text) {
        text = element.outerHTML.replace(/\s+/g, ' ').trim();
      }
      if (/^<[^<>]+>$/.test(text)) {
        text = element.parentElement.outerHTML.replace(/\s+/g, ' ').trim();
      }
      // Location.
      let location = {
        doc: 'dom',
        type: 'box',
        spec: {}
      };
      if (id) {
        location.type = 'selector';
        location.spec = `#${id}`;
      }
      // Return the data.
      return {
        tagName,
        id,
        location,
        excerpt: text
      };
    });
    // If an ID-based selector could not be defined:
    if (data.location.type === 'box') {
      // Define a bounding-box-based location.
      const rawSpec = await loc.boundingBox();
      // If there is a bounding box (i.e. the element is visible):
      if (rawSpec) {
        // Populate the location.
        Object.keys(rawSpec).forEach(specName => {
          data.location.spec[specName] = Math.round(rawSpec[specName]);
        });
      }
      // Otherwise, i.e. if there is no bounding box:
      else {
        // Empty the location.
        data.location.doc = '';
        data.location.type = '';
        data.location.spec = '';
      }
    }
    // If the text is long:
    if (data.excerpt.length > 400) {
      // Truncate its middle.
      data.excerpt = `${data.excerpt.slice(0, 200)} … ${data.excerpt.slice(-200)}`;
    }
    // Return the data.
    return data;
  }
  // Otherwise, i.e. if it does not identify exactly 1 element:
  else {
    // Report this.
    console.log(`ERROR: Locator count to get data from is ${locCount} instead of 1`);
    return null;
  }
};
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
        const segments = element.innerText?.trim().split(/[\t\n]+/);
        if (segments) {
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
