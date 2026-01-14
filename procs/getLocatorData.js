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
// Returns location data from the extract of a standard instance.
exports.getLocationData = async (page, excerpt) => {
  console.log('\nXXX Starting getLocationData');
  const testaroIDArray = excerpt.match(/data-testaro-id="(\d+)#([^"]*)"/);
  // If the extract contains a Testaro identifier:
  if (testaroIDArray) {
    console.log(`XXX Found testaroID in excerpt: ${excerpt}`);
    const testaroID = `${testaroIDArray[1]}#${testaroIDArray[2]}`;
    // Return location data for the element.
    return await page.evaluate(testaroID => {
      const element = document.querySelector(`[data-testaro-id="${testaroID}"]`);
      // If any element has that identifier:
      if (element) {
        console.log(`XXX Found element with testaroID: ${testaroID}`);
        // Get box and path IDs for the element.
        const box = {};
        let boxID = '';
        const boundingBox = element.getBoundingClientRect() || {};
        if (boundingBox.x) {
          ['x', 'y', 'width', 'height'].forEach(coordinate => {
            box[coordinate] = Math.round(boundingBox[coordinate]);
          });
        }
        if (typeof box.x === 'number') {
          boxID = Object.values(box).join(':');
        }
        console.log(`XXX testaroID: ${testaroID}`);
        const oldPathID = testaroID.replace(/^.*?#/, '');
        console.log(`XXX oldPathID: ${oldPathID}`);
        const newPathID = window.getXPath(element);
        console.log(`XXX newPathID: ${newPathID}`);
        let pathID = '';
        // If the XPath of the element is the same as that in the identifier:
        if (newPathID === oldPathID) {
          // Use it as the path ID.
          pathID = oldPathID;
        }
        // Otherwise, if both paths exist but differ:
        else if (oldPathID && newPathID) {
          // Use both as a path ID.
          pathID = `${newPathID} (originally: ${oldPathID})`;
        }
        // Otherwise, i.e. if only one of them exists:
        else {
          // Use the existing one as the path ID.
          pathID = newPathID || oldPathID;
        }
        // Return the box and path IDs.
        console.log(`XXX About to return:\n${JSON.stringify({
          boxID,
          pathID
        }, null, 2)}`);
        return {
          boxID,
          pathID
        };
      }
      // Otherwise, if no element has it but the identifier includes an XPath:
      else if (testaroIDArray[2]) {
        console.log('XXX testaroID has an XPath buto element has the testaroID');
        // Return an empty box ID and that XPath as a path ID.
        return {
          notInDOM: true,
          boxID: '',
          pathID: testaroIDArray[2]
        };
      }
      // Otherwise, return empty location properties.
      console.log('XXX No element has the testaroID and it has no XPath');
      return {
        notInDOM: true,
        boxID: '',
        pathID: ''
      };
    }, testaroID);
  }
  // Otherwise, i.e. if the extract contains no Testaro identifier:
  else {
    console.log(`XXX No Testaro identifier in excerpt ${excerpt}`);
    // Return a non-DOM location.
    return {
      notInDOM: true,
      boxID: '',
      pathID: ''
    };
  }
};
