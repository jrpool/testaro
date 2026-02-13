/*
  © 2023–2024 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025–2026 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  standardize.js
  Converts test results to the standard format.
*/

// IMPORTS

const {cap} = require('./job');

// FUNCTIONS

// Returns whether an id attribute value is valid without character escaping.
const isBadID = id => /[^-\w]|^\d|^--|^-\d/.test(id);
// Returns a tag name and the value of an id attribute from a substring of HTML code.
const getIdentifiers = exports.getIdentifiers = code => {
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
// Converts issue instances from a nuVal or nuVnu result.
const doNu = (withSource, result, standardResult) => {
  const items = result && result.messages;
  // If there are any messages:
  if (items && items.length) {
    // For each one:
    items.forEach(item => {
      const {
        extract,
        firstColumn,
        lastColumn,
        lastLine,
        message,
        subType,
        type,
        elementLocation
      } = item;
      const identifiers = getIdentifiers(extract);
      if (! identifiers[0] && message) {
        const tagNameLCArray = message.match(
          /^Element ([^ ]+)|^An (img) element| (meta|script) element| element (script)| tag (script)/
        );
        if (tagNameLCArray && tagNameLCArray[1]) {
          identifiers[0] = tagNameLCArray[1].toUpperCase();
        }
      }
      let spec = '';
      const locationSegments = [lastLine, firstColumn, lastColumn];
      if (locationSegments.every(segment => typeof segment === 'number')) {
        spec = locationSegments.join(':');
      }
      const {notInDOM} = elementLocation;
      const instance = {
        ruleID: message,
        what: message,
        ordinalSeverity: -1,
        tagName: identifiers[0],
        id: identifiers[1],
        location: {
          doc: withSource ? 'source' : (notInDOM ? 'notInDOM' : 'dom'),
          type: 'code',
          spec
        },
        excerpt: cap(extract),
        boxID: elementLocation?.boxID || '',
        pathID: elementLocation?.pathID || ''
      };
      if (type === 'info' && subType === 'warning') {
        instance.ordinalSeverity = 0;
      }
      else if (type === 'error') {
        instance.ordinalSeverity = subType === 'fatal' ? 3 : 2;
      }
      standardResult.instances.push(instance);
    });
  }
};
// Converts issue instances from a nuVal result.
const doNuVal = (withSource, result, standardResult) => {
  doNu(withSource, result, standardResult);
};
// Converts issue instances from a nuVnu result.
const doNuVnu = (withSource, result, standardResult) => {
  doNu(withSource, result, standardResult);
};
// Populates the initialized standard result of an act with the act data and result.
const convert = (toolName, data, result, standardResult) => {
  // If the act data state that the act was prevented:
  if (data.prevented) {
    // Add that to the standard result and disregard tool-specific conversions.
    standardResult.prevented = true;
  }
  // Otherwise, if the act was not prevented and the tool is self-standardizing:
  else if (
    ! ['wax'].includes(toolName)
    && result.standardResult
  ) {
    // Move the results to standard locations.
    Object.assign(result, result.nativeResult);
    Object.assign(standardResult, result.standardResult);
    delete result.nativeResult;
    delete result.standardResult;
  }
  // nuVal
  else if (toolName === 'nuVal' && result) {
    doNuVal(data.withSource, result, standardResult);
  }
  // nuVnu
  else if (toolName === 'nuVnu' && result) {
    doNuVnu(data.withSource, result, standardResult);
  }
  // wax
  else if (toolName === 'wax' && result.violations && result.violations.length) {
    // For each violation:
    result.violations.forEach(violation => {
      // Get its standard instance properties.
      const element = violation.element.replace(/\s+/g, ' ');
      const {boxID, description, message, notInDOM, pathID, severity} = violation;
      const ordinalSeverity = ['Minor', 'Moderate', '', 'Severe'].indexOf(severity);
      const tagNameCandidate = element.replace(/^<| .*$/g, '');
      const tagName = /^[a-zA-Z0-9]+$/.test(tagNameCandidate) ? tagNameCandidate.toUpperCase() : '';
      let id = '';
      const location = {};
      if (notInDOM) {
        location.doc = 'notInDOM';
        location.type = '';
        location.spec = '';
      }
      else if (tagName) {
        const idTerm = element
        .replace(/>.*$/, '')
        .split(' ')
        .slice(1)
        .find(term => term.startsWith('id="'));
        if (idTerm) {
          const idCandidate = idTerm.slice(4, -1);
          if (! idCandidate.includes('"')) {
            id = idCandidate;
            location.doc = 'dom';
            location.type = 'selector';
            location.spec = `#${id}`;
          }
        }
      }
      const instance = {
        ruleID: message,
        what: description,
        ordinalSeverity,
        tagName,
        id,
        location,
        excerpt: element,
        boxID,
        pathID
      };
      // Add the instance to the standard result.
      standardResult.instances.push(instance);
    });
  }
  // Populate the totals of the standard result if the tool is not Alfa, ASLint, HTMLCS, Testaro or WAVE.
  if (! ['alfa', 'aslint', 'htmlcs', 'testaro', 'wave'].includes(toolName)) {
    standardResult.instances.forEach(instance => {
      standardResult.totals[instance.ordinalSeverity] += instance.count || 1;
    });
  }
  // Round the totals of the standard result.
  standardResult.totals = standardResult.totals.map(total => Math.round(total));
};
// Populates the initialized standard result of an act.
exports.standardize = act => {
  const {which, data, result, standardResult} = act;
  if (which && result && standardResult) {
    convert(which, data, result, standardResult);
  }
  else {
    console.log(`ERROR: Result of incomplete ${which || 'unknown'} act cannot be standardized`);
  }
};
