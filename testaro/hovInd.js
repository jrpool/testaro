/*
  © 2023–2025 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  hovInd
  This test reports confusing hover indication.
*/

// IMPORTS

const {doTest} = require('../procs/testaro');

// FUNCTIONS

exports.reporter = async (page, withItems) => {
  const getBadWhat = element => {
    const violationTypes = [];
    const isVisible = element.checkVisibility({
      contentVisibilityAuto: true,
      opacityProperty: true,
      visibilityProperty: true
    });
    // If the element is visible:
    if (isVisible) {
      // Get its live style declaration.
      const styleDec = window.getComputedStyle(element);
      // FUNCTION DEFINITIONS START
      // Returns hover-related style data on a trigger.
      const getStyleData = () => {
        const {
          cursor,
          borderColor,
          borderStyle,
          borderWidth,
          outlineColor,
          outlineStyle,
          outlineWidth,
          outlineOffset,
          color,
          backgroundColor
        } = styleDec;
        return {
          tagName: element.tagName,
          inputType: element.tagName === 'INPUT' ? element.getAttribute('type') || 'text' : null,
          cursor: cursor.replace(/^.+, */, ''),
          border: `${borderColor} ${borderStyle} ${borderWidth}`,
          outline: `${outlineColor} ${outlineStyle} ${outlineWidth} ${outlineOffset}`,
          color,
          backgroundColor
        };
      };
      // Returns whether the cursor is bad when the element is hovered over.
      const cursorIsBad = hoverCursor => {
        const {tagName, type} = element;
        if (tagName === 'A' || tagName === 'INPUT' && type === 'image') {
          return hoverCursor !== 'pointer';
        }
        if (tagName === 'INPUT') {
          return hoverCursor !== 'text';
        }
        return ! ['auto', 'default'].includes(hoverCursor);
      };
      // Returns whether two hover styles are effectively identical.
      const areAlike = (styles0, styles1) => {
        // Return whether they are effectively identical.
        const areAlike = ['cursor', 'backgroundColor', 'border', 'color', 'outline']
        .every(style => styles1[style] === styles0[style]);
        return areAlike;
      };
      // FUNCTION DEFINITIONS END
      // Get its style data when neither focused nor hovered over.
      const defaultStyleData = getStyleData();
      // Get its style data when only focused.
      element.focus();
      const focusStyleData = getStyleData();
      // Get its style data when only hovered over.
      element.blur();
      element.dispatchEvent(new MouseEvent('mouseenter'));
      const hoverStyleData = getStyleData();
      const data = {};
      // If the cursor is confusing when the element is only hovered over:
      if (cursorIsBad(hoverStyleData.cursor)) {
        // Add this to the violation types.
        violationTypes.push(
          `nonstandard mouse cursor (${hoverStyleData.cursor}) when hovered over`
        );
      }
      // If the neutral and hover styles are indistinguishable:
      if (areAlike(defaultStyleData, hoverStyleData)) {
        // Add this to the violation types.
        violationTypes.push('normal and hover styles are indistinguishable');
        // Add the details to the data.
        data.n_h = {
          neutral: defaultStyleData,
          hover: hoverStyleData
        };
      }
      // If the focus and hoverstyles are indistinguishable:
      if (areAlike(focusStyleData, hoverStyleData)) {
        // Add this to the violation types.
        violationTypes.push('focus and hover styles are indistinguishable');
        // Add the details to the data.
        data.f_h = {
          focus: focusStyleData,
          hover: hoverStyleData
        };
      }
      // If any violations occurred:
      if (violationTypes.length) {
        const description = `Element styles do not clearly indicate hovering ${violationTypes.join('; ')}`;
        // If there are additional data:
        if (Object.keys(data).length) {
          // Return the violation description and data.
          return {
            description,
            data
          };
        }
        // Otherwise, i.e. if there are no additional data:
        else {
          // Return the violation description.
          return description;
        }
      }
    }
  };
  const selector = 'a, button, input, [onmouseenter], [onmouseover]';
  const whats = 'elements have confusing hover indicators';
  return await doTest(page, withItems, 'hovInd', selector, whats, 1, null, getBadWhat.toString());
};
