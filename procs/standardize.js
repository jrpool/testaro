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
// Converts instances of a qualWeb rule class.
const doQualWeb = (result, standardResult, ruleClassName) => {
  if (result.modules && result.modules[ruleClassName]) {
    const ruleClass = result.modules[ruleClassName];
    const severities = {
      'best-practices': {
        warning: 0,
        failed: 1
      },
      'wcag-techniques': {
        warning: 0,
        failed: 2
      },
      'act-rules': {
        warning: 1,
        failed: 3
      }
    };
    Object.keys(ruleClass.assertions).forEach(ruleID => {
      const ruleResult = ruleClass.assertions[ruleID];
      ruleResult.results.forEach(item => {
        item.elements.forEach(element => {
          const {htmlCode} = element;
          const identifiers = getIdentifiers(htmlCode);
          const instance = {
            ruleID,
            what: item.description,
            ordinalSeverity: severities[ruleClassName][item.verdict] || 0,
            tagName: identifiers[0],
            id: identifiers[1],
            location: {
              doc: 'dom',
              type: 'selector',
              spec: element.pointer
            },
            excerpt: cap(htmlCode),
            boxID: element.locationData?.boxID || '',
            pathID: element.locationData?.pathID || ''
          };
          standardResult.instances.push(instance);
        });
      });
    });
  }
};
// Converts instances of a wave rule category.
const doWAVE = (result, standardResult, categoryName) => {
  // If results for the category are reported:
  if (result.categories && result.categories[categoryName]) {
    const category = result.categories[categoryName];
    const ordinalSeverity = categoryName === 'alert' ? 0 : 3;
    const {items} = category;
    // If any violations in the category are reported:
    if (items) {
      // For each rule violated:
      Object.keys(items).forEach(ruleID => {
        const item = items[ruleID];
        // For each violation:
        item.selectors.forEach(violationFacts => {
          let tagName = '';
          let id = '';
          const finalTerm = violationFacts[0].replace(/^.+\s/, '');
          // If the selector is an element ID:
          if (finalTerm.includes('#')) {
            const finalArray = finalTerm.split('#');
            // Use it to get the element tagname and ID
            tagName = finalArray[0].replace(/:.*/, '');
            id = isBadID(finalArray[1]) ? '' : finalArray[1];
          }
          // Otherwise, i.e. if the selector is not an element ID:
          else {
            // Get the element tagname from it.
            tagName = finalTerm.replace(/:.*/, '') || 'HTML';
          }
          const {wcag} = item;
          // Get a violation description suffix from the WCAG data of the rule.
          const wcagSuffix = wcag.length
            ? ` (${wcag.map(wcagItem => wcagItem.name).join('; ')})`
            : '';
          // Get a standard instance.
          const instance = {
            ruleID,
            what: `${item.description}${wcagSuffix}`,
            ordinalSeverity,
            tagName,
            id,
            location: {
              doc: 'dom',
              type: 'selector',
              spec: violationFacts[0] || 'html'
            },
            excerpt: violationFacts[1],
            boxID: '',
            pathID: ''
          };
          // Add it to the standard result.
          standardResult.instances.push(instance);
        });
      });
    }
  }
};
// Populates the initialized standard result of an act with the act data and result.
const convert = (toolName, data, result, standardResult) => {
  // If the act data state that the act was prevented:
  if (data.prevented) {
    // Add that to the standard result and disregard tool-specific conversions.
    standardResult.prevented = true;
  }
  // alfa, aslint
  else if (
    ['alfa', 'aslint', 'axe', 'ed11y', 'htmlcs', 'ibm', 'nuVal', 'nuVnu'].includes(toolName)
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
  // qualWeb
  else if (
    toolName === 'qualWeb'
    && result.modules
    && (
      result.modules['act-rules']
      || result.modules['wcag-techniques']
      || result.modules['best-practices']
    )
  ) {
    if (result.modules['act-rules']) {
      doQualWeb(result, standardResult, 'act-rules');
    }
    if (result.modules['wcag-techniques']) {
      doQualWeb(result, standardResult, 'wcag-techniques');
    }
    if (result.modules['best-practices']) {
      doQualWeb(result, standardResult, 'best-practices');
    }
  }
  // testaro
  else if (toolName === 'testaro') {
    // Initialize a record of instance totals by rule and severity.
    data.ruleTotals = {};
    // For each violated rule:
    const rules = result ? Object.keys(result) : [];
    rules.forEach(rule => {
      // Copy its instances to the standard result.
      const ruleResult = result[rule];
      ruleResult.standardInstances ??= [];
      standardResult.instances.push(... ruleResult.standardInstances);
      // Initialize a record of its sample-ratio-weighted totals.
      data.ruleTotals[rule] = [0, 0, 0, 0];
      // Add those totals to the record and to the standard result.
      ruleResult.totals ??= [0, 0, 0, 0];
      for (const index in ruleResult.totals) {
        const ruleTotal = ruleResult.totals[index];
        data.ruleTotals[rule][index] += ruleTotal;
        standardResult.totals[index] += ruleTotal;
      }
    });
    const preventionCount = result.preventions && result.preventions.length;
    if (preventionCount) {
      standardResult.instances.push({
        ruleID: 'testPrevention',
        what: 'Page prevented tests from being performed',
        ordinalSeverity: 3,
        count: preventionCount,
        tagName: '',
        id: '',
        location: '',
        excerpt: '',
        boxID: '',
        pathID: ''
      });
    }
  }
  // wave
  else if (
    toolName === 'wave'
    && result.categories
    && (
      result.categories.error
      || result.categories.contrast
      || result.categories.alert
    )
  ) {
    const {categories} = result;
    standardResult.totals = [0, 0, 0, 0];
    standardResult.totals[0] = categories.alert.count;
    standardResult.totals[3] = (categories.error.count || 0) + (categories.contrast.count || 0);
    ['error', 'contrast', 'alert'].forEach(categoryName => {
      doWAVE(result, standardResult, categoryName);
    });
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
