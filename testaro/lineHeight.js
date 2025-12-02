/*
  © 2023–2024 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Jonathan Robert Pool. All rights reserved.

  MIT License

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all
  copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  SOFTWARE.
*/

/*
  lineHeight
  Related to Tenon rule 144.
  This test reports elements whose line heights are less than 1.5 times their font sizes. Even
  such elements with no text create accessibility risk, because any text node added to one of
  them would have a substandard line height. Nonetheless, elements with no non-spacing text in
  their subtrees are excluded.
*/

// FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (page, withItems) => {
  const violators = await page.evaluate(() => {
    const elements = document.body.querySelectorAll('*');
    const elementsWithText = Array.from(elements).filter(el =>
      Array.from(el.childNodes).some(child =>
        child.nodeType === Node.TEXT_NODE &&
        child.textContent.trim().length
      )
    );
    const violatorData = [];
    elementsWithText.forEach(el => {
      const styleDec = window.getComputedStyle(el);
      const {fontSize, lineHeight} = styleDec;
      const fontSizeNum = Number.parseFloat(fontSize);
      const lineHeightNum = Number.parseFloat(lineHeight);
      const fontSizeTrunc = fontSizeNum.toFixed(1);
      const lineHeightTrunc = lineHeightNum.toFixed(1);
      if (lineHeightNum < 1.495 * fontSizeNum) {
        const boxData = el.getBoundingClientRect();
        ['x', 'y', 'width', 'height'].forEach(dimension => {
          boxData[dimension] = Math.round(boxData[dimension]);
        });
        const {x, y, width, height} = boxData;
        violatorData.push({
          tagName: el.tagName,
          id: el.id,
          location: {
            doc: 'dom',
            type: 'box',
            spec: {
              x,
              y,
              width,
              height
            }
          },
          excerpt: el.textContent.trim(),
          boxID: [x, y, width, height].join(':'),
          fontSize: fontSizeTrunc,
          lineHeight: lineHeightTrunc
        });
      }
    });
    return violatorData;
  });
  return {
    data: {},
    totals: [0, violators.length, 0, 0],
    standardInstances: violators.map(violator => {
      const {tagName, id, location, excerpt, boxID, fontSize, lineHeight} = violator;
      return {
        ruleID: 'lineHeight',
        what: `Element line height (${lineHeight}px) is less than 1.5 times its font size (${fontSize}px)`,
        ordinalSeverity: 1,
        tagName,
        id,
        location,
        excerpt,
        boxID,
        pathID: ''
      };
    })
  };
};
