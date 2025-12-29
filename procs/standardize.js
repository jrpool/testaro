/*
  © 2023–2024 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  standardize.js
  Converts test results to the standard format.
*/

// ########## FUNCTIONS

// Limits the length of and unilinearizes a string.
const cap = rawString => {
  const string = (rawString || '').replace(/[\s\u2028\u2029]+/g, ' ');
  if (string && string.length > 1000) {
    return `${string.slice(0, 500)} … ${string.slice(-500)}`;
  }
  else if (string) {
    return string;
  }
  else {
    return '';
  }
};
// Returns whether an id attribute value is valid without character escaping.
const isBadID = id => /[^-\w]|^\d|^--|^-\d/.test(id);
// Returns a tag name and the value of an id attribute from a substring of HTML code.
const getIdentifiers = code => {
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
    const idData = startTagData[1].match(/ id="([^"]+)"/);
    const id = idData ? idData[1] : '';
    // Return the tag name and the value of the id attribute, if any.
    return [tagName, id];
  }
  return ['', ''];
};
/*
  Differentiates some rule IDs of aslint.
  If the purported rule ID is a key and the what property contains all of the strings except the
  last of any array item of the value of that key, then the final rule ID is the last item of that
  array item.
*/
const aslintData = {
  'misused_required_attribute': [
    ['not needed', 'misused_required_attributeR']
  ],
  'accessible_svg': [
    ['associated', 'accessible_svgI'],
    ['tabindex', 'accessible_svgT']
  ],
  'audio_alternative': [
    ['track', 'audio_alternativeT'],
    ['alternative', 'audio_alternativeA'],
    ['bgsound', 'audio_alternativeB']
  ],
  'table_missing_description': [
    ['describedby', 'associated', 'table_missing_descriptionDM'],
    ['labeledby', 'associated', 'table_missing_descriptionLM'],
    ['caption', 'not been defined', 'table_missing_descriptionC'],
    ['summary', 'empty', 'table_missing_descriptionS'],
    ['describedby', 'empty', 'table_missing_descriptionDE'],
    ['labeledby', 'empty', 'table_missing_descriptionLE'],
    ['caption', 'no content', 'table_missing_descriptionE']
  ],
  'label_implicitly_associated': [
    ['only whice spaces', 'label_implicitly_associatedW'],
    ['more than one', 'label_implicitly_associatedM']
  ],
  'label_inappropriate_association': [
    ['Missing', 'label_inappropriate_associationM'],
    ['non-form', 'label_inappropriate_associationN']
  ],
  'table_row_and_column_headers': [
    ['headers', 'table_row_and_column_headersRC'],
    ['Content', 'table_row_and_column_headersB'],
    ['head of the columns', 'table_row_and_column_headersH']
  ],
  'color_contrast_state_pseudo_classes_abstract': [
    ['position: fixed', 'color_contrast_state_pseudo_classes_abstractF'],
    ['transparent', 'color_contrast_state_pseudo_classes_abstractB'],
    ['least 3:1', 'color_contrast_state_pseudo_classes_abstract3'],
    ['least 4.5:1', 'color_contrast_state_pseudo_classes_abstract4']
  ],
  'color_contrast_state_pseudo_classes_active': [
    ['position: fixed', 'color_contrast_state_pseudo_classes_abstractF'],
    ['transparent', 'color_contrast_state_pseudo_classes_abstractB'],
    ['least 3:1', 'color_contrast_state_pseudo_classes_abstract3'],
    ['least 4.5:1', 'color_contrast_state_pseudo_classes_abstract4']
  ],
  'color_contrast_state_pseudo_classes_focus': [
    ['position: fixed', 'color_contrast_state_pseudo_classes_abstractF'],
    ['transparent', 'color_contrast_state_pseudo_classes_abstractB'],
    ['least 3:1', 'color_contrast_state_pseudo_classes_abstract3'],
    ['least 4.5:1', 'color_contrast_state_pseudo_classes_abstract4']
  ],
  'color_contrast_state_pseudo_classes_hover': [
    ['position: fixed', 'color_contrast_state_pseudo_classes_abstractF'],
    ['transparent', 'color_contrast_state_pseudo_classes_abstractB'],
    ['least 3:1', 'color_contrast_state_pseudo_classes_abstract3'],
    ['least 4.5:1', 'color_contrast_state_pseudo_classes_abstract4']
  ],
  'color_contrast_aaa': [
    ['transparent', 'color_contrast_aaaB'],
    ['least 4.5:1', 'color_contrast_aaa4'],
    ['least 7:1', 'color_contrast_aaa7']
  ],
  'animation': [
    ['duration', 'animationD'],
    ['iteration', 'animationI'],
    ['mechanism', 'animationM']
  ],
  'page_title': [
    ['empty', 'page_titleN'],
    ['not identify', 'page_titleU']
  ],
  'aria_labelledby_association': [
    ['exist', 'aria_labelledby_associationN'],
    ['empty', 'aria_labelledby_associationE']
  ],
  'html_lang_attr': [
    ['parameters', 'html_lang_attrP'],
    ['nothing', 'html_lang_attrN'],
    ['empty', 'html_lang_attrE']
  ],
  'missing_label': [
    ['associated', 'missing_labelI'],
    ['defined', 'missing_labelN'],
    ['multiple labels', 'missing_labelM']
  ],
  'orientation': [
    ['loaded', 'orientationT']
  ]
};
// Converts issue instances at an axe certainty level.
const doAxe = (result, standardResult, certainty) => {
  if (result.details && result.details[certainty]) {
    result.details[certainty].forEach(rule => {
      rule.nodes.forEach(node => {
        const whatSet = new Set([
          rule.help,
          ... node.any.map(anyItem => anyItem.message),
          ... node.all.map(allItem => allItem.message)
        ]);
        const severityWeights = {
          minor: 0,
          moderate: 0,
          serious: 1,
          critical: 1
        };
        const ordinalSeverity = severityWeights[node.impact] + (certainty === 'violations' ? 2 : 0);
        const identifiers = getIdentifiers(node.html);
        const instance = {
          ruleID: rule.id,
          what: Array.from(whatSet.values()).join('; '),
          ordinalSeverity,
          tagName: identifiers[0],
          id: identifiers[1],
          location: {
            doc: 'dom',
            type: 'selector',
            spec: node.target && node.target.length ? node.target[0] : ''
          },
          excerpt: cap(node.html)
        };
        standardResult.instances.push(instance);
      });
    });
  }
};
// Converts issue instances at an htmlcs severity level.
const doHTMLCS = (result, standardResult, severity) => {
  if (result[severity]) {
    Object.keys(result[severity]).forEach(ruleID => {
      const ruleData = result[severity][ruleID];
      Object.keys(ruleData).forEach(what => {
        ruleData[what].forEach(item => {
          const {tagName, id, code} = item;
          const instance = {
            ruleID,
            what,
            ordinalSeverity: ['Warning', '', '', 'Error'].indexOf(severity),
            tagName: tagName.toUpperCase(),
            id: isBadID(id.slice(1)) ? '' : id.slice(1),
            location: {
              doc: 'dom',
              type: '',
              spec: ''
            },
            excerpt: cap(code)
          };
          standardResult.instances.push(instance);
        });
      });
    });
  }
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
        boxID: elementLocation?.box || {},
        pathID: elementLocation?.xPath || ''
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
            excerpt: cap(htmlCode)
          };
          standardResult.instances.push(instance);
        });
      });
    });
  }
};
// Converts instances of a wave rule category.
const doWAVE = (result, standardResult, categoryName) => {
  if (result.categories && result.categories[categoryName]) {
    const category = result.categories[categoryName];
    const ordinalSeverity = categoryName === 'alert' ? 0 : 3;
    const {items} = category;
    if (items) {
      Object.keys(items).forEach(ruleID => {
        items[ruleID].selectors.forEach(selector => {
          let tagName = '';
          let id = '';
          if (typeof selector === 'string') {
            const finalTerm = selector.replace(/^.+\s/, '');
            if (finalTerm.includes('#')) {
              const finalArray = finalTerm.split('#');
              tagName = finalArray[0].replace(/:.*/, '');
              id = isBadID(finalArray[1]) ? '' : finalArray[1];
            }
            else {
              tagName = finalTerm.replace(/:.*/, '');
            }
          }
          const instance = {
            ruleID,
            what: items[ruleID].description,
            ordinalSeverity,
            tagName,
            id,
            location: {
              doc: 'dom',
              type: 'selector',
              spec: selector
            },
            excerpt: ''
          };
          standardResult.instances.push(instance);
        });
      });
    }
  }
};
// Converts a result.
const convert = (toolName, data, result, standardResult) => {
  // Prevention.
  if (data.prevented) {
    standardResult.prevented = true;
  }
  // alfa
  else if (toolName === 'alfa' && result.totals) {
    result.items.forEach(item => {
      const {codeLines} = item.target;
      const code = Array.isArray(codeLines) ? codeLines.join(' ') : '';
      const identifiers = getIdentifiers(code);
      const tagNameArray = item.target
      && item.target.path
      && item.target.path.match(/^.*\/([a-z]+)\[\d+\]/);
      if (tagNameArray && tagNameArray.length === 2) {
        identifiers[0] = tagNameArray[1].toUpperCase();
      }
      const {rule, target} = item;
      let instance;
      if (item.verdict === 'failed') {
        instance = {
          ruleID: rule.ruleID,
          what: rule.ruleSummary,
          ordinalSeverity: 3,
          tagName: identifiers[0],
          id: identifiers[1],
          location: {
            doc: 'dom',
            type: 'xpath',
            spec: target.path
          },
          excerpt: cap(code)
        };
        standardResult.instances.push(instance);
      }
      else if (item.verdict === 'cantTell') {
        if (['r66', 'r69'].includes(rule.ruleID)) {
          instance = {
            ruleID: 'cantTellTextContrast',
            what: `cannot test for rule ${rule.ruleID}: ${rule.ruleSummary}`,
            ordinalSeverity: 0,
            tagName: identifiers[0],
            id: identifiers[1],
            location: {
              doc: 'dom',
              type: 'xpath',
              spec: target.path
            },
            excerpt: cap(code)
          };
        }
        else {
          instance = {
            ruleID: 'cantTell',
            what: `cannot test for rule ${rule.ruleID}: ${rule.ruleSummary}`,
            ordinalSeverity: 0,
            tagName: identifiers[0],
            id: identifiers[1],
            location: {
              doc: 'dom',
              type: 'xpath',
              spec: target.path
            },
            excerpt: cap(code)
          };
        }
        standardResult.instances.push(instance);
      }
    });
  }
  // aslint
  else if (toolName === 'aslint' && result.summary && result.summary.byIssueType) {
    // For each rule:
    Object.keys(result.rules).forEach(ruleID => {
      // If it has a valid issue type:
      const {issueType} = result.rules[ruleID];
      if (issueType && ['warning', 'error'].includes(issueType)) {
        // If there are any violations:
        const ruleResults = result.rules[ruleID].results;
        if (ruleResults && ruleResults.length) {
          // For each violation:
          ruleResults.forEach(ruleResult => {
            // If it has a description:
            if (
              ruleResult.message
              && ruleResult.message.actual
              && ruleResult.message.actual.description
            ) {
              const what = ruleResult.message.actual.description;
              // Get the differentiated ID of the rule if any.
              const ruleData = aslintData[ruleID];
              let finalRuleID = ruleID;
              if (ruleData) {
                const changer = ruleData.find(
                  specs => specs.slice(0, -1).every(matcher => what.includes(matcher))
                );
                if (changer) {
                  finalRuleID = changer[changer.length - 1];
                }
              }
              // Get the instance properties.
              const xpath = ruleResult.element && ruleResult.element.xpath || '';
              let tagName = xpath
              && xpath.replace(/^.*\//, '').replace(/[^-\w].*$/, '').toUpperCase()
              || '';
              if (! tagName && finalRuleID.endsWith('_svg')) {
                tagName = 'SVG';
              }
              const excerpt = ruleResult.element && ruleResult.element.html.replace(/\s+/g, ' ')
              || '';
              if (! tagName && /^<[a-z]+[ >]/.test(excerpt)) {
                tagName = excerpt.slice(1).replace(/[ >].+/, '').toUpperCase();
              }
              const idDraft = excerpt && excerpt.replace(/^[^[>]+id="/, 'id=').replace(/".*$/, '');
              const idFinal = idDraft && idDraft.length > 3 && idDraft.startsWith('id=')
                ? idDraft.slice(3)
                : '';
              const id = idFinal === '' || isBadID(idFinal) ? '' : idFinal;
              const instance = {
                ruleID: finalRuleID,
                what,
                ordinalSeverity: ['warning', 0, 0, 'error'].indexOf(issueType),
                tagName,
                id,
                location: {
                  doc: 'dom',
                  type: 'xpath',
                  spec: xpath
                },
                excerpt
              };
              standardResult.instances.push(instance);
            }
          });
        }
      }
    });
  }
  // axe
  else if (
    toolName === 'axe'
    && result
    && result.totals
    && (result.totals.rulesWarned || result.totals.rulesViolated)
  ) {
    doAxe(result, standardResult, 'incomplete');
    doAxe(result, standardResult, 'violations');
  }
  // ed11y
  else if (
    toolName === 'ed11y'
    && result
    && ['imageAlts', 'violations', 'errorCount', 'warningCount']
    .every(key => result[key] !== undefined)
  ) {
    // For each violation:
    result.violations.forEach(violation => {
      const {test, content, tagName, id, loc, excerpt, boxID, pathID} = violation;
      if (['test', 'content'].every(key => key)) {
        // Standardize the what property.
        let what = '';
        if (content.includes('<p>This')) {
          what = content.replace(/^.*?<p>(This.+?)<\/p> *<p>(.*?)<\/p>.*/, '$1 $2');
        }
        else {
          what = content.replace(/^.*?<p>(.+?)<\/p>.*/, '$1');
        }
        // Add a standard instance to the standard result.
        standardResult.instances.push({
          ruleID: test,
          what,
          ordinalSeverity: 0,
          tagName,
          id: isBadID(id) ? '' : id,
          location: {
            doc: 'dom',
            type: 'box',
            spec: loc
          },
          excerpt,
          boxID,
          pathID
        });
      }
    });
  }
  // htmlcs
  else if (toolName === 'htmlcs' && result) {
    doHTMLCS(result, standardResult, 'Warning');
    doHTMLCS(result, standardResult, 'Error');
  }
  // ibm
  else if (toolName === 'ibm' && result.totals) {
    if (result.items) {
      result.items.forEach(item => {
        const identifiers = getIdentifiers(item.snippet);
        if (! identifiers[0] && item.path && item.path.dom) {
          const tagNameArray = item.path.dom.match(/^.+\/([^/[]+)/s);
          if (tagNameArray && tagNameArray.length === 2) {
            identifiers[0] = tagNameArray[1].toUpperCase();
          }
        }
        const instance = {
          ruleID: item.ruleId,
          what: item.message,
          ordinalSeverity: ['', 'recommendation', '', 'violation'].indexOf(item.level),
          tagName: identifiers[0],
          id: identifiers[1],
          location: {
            doc: 'dom',
            type: 'xpath',
            spec: item.path.dom
          },
          excerpt: cap(item.snippet)
        };
        standardResult.instances.push(instance);
      });
    }
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
    // Initialize a record of sample-ratio-weighted totals.
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
        excerpt: ''
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
      const {message, description, severity} = violation;
      const ordinalSeverity = ['Minor', 'Moderate', '', 'Severe'].indexOf(severity);
      const tagNameCandidate = element.replace(/^<| .*$/g, '');
      const tagName = /^[a-zA-Z0-9]+$/.test(tagNameCandidate) ? tagNameCandidate.toUpperCase() : '';
      let id = '';
      const location = {};
      if (tagName) {
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
        excerpt: element
      };
      // Add the instance to the standard result.
      standardResult.instances.push(instance);
    });
  }
  // Populate the totals of the standard result if the tool is not Testaro or WAVE.
  if (! ['testaro', 'wave'].includes(toolName)) {
    standardResult.instances.forEach(instance => {
      standardResult.totals[instance.ordinalSeverity] += instance.count || 1;
    });
  }
  // Round the totals of the standard result.
  standardResult.totals = standardResult.totals.map(total => Math.round(total));
};
// Converts the results of a test act.
exports.standardize = act => {
  const {which, data, result, standardResult} = act;
  if (which && result && standardResult) {
    convert(which, data, result, standardResult);
  }
  else {
    console.log(`ERROR: Result of incomplete ${which || 'unknown'} act cannot be standardized`);
  }
};
