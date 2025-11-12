/*
  © 2025 CVS Health and/or one of its affiliates. All rights reserved.
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
  legendLoc
  Clean-room rule: flag legend elements that are not the first child of a fieldset element.
*/

const {simplify} = require('../procs/testaro');

exports.reporter = async (page, withItems) => {
  const ruleData = {
    ruleID: 'legendLoc',
    selector: 'legend',
    pruner: async (loc) => {
      return loc.evaluate(el => {
        const parent = el.parentElement;
        if (!parent) return true;
        if (parent.tagName.toUpperCase() !== 'FIELDSET') return true;
        // Check if this legend is the first element child of the fieldset
        for (const child of parent.children) {
          if (child.nodeType === 1) {
            return child !== el; // true if not first child
          }
        }
        return true;
      });
    },
    complaints: {
      instance: 'Element is not the first child of a fieldset element',
      summary: 'legend elements are not the first children of fieldset elements'
    },
    ordinalSeverity: 3,
    summaryTagName: 'LEGEND'
  };
  return await simplify(page, withItems, ruleData);
};
