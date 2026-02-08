/*
  © 2023–2025 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  targetSmall
  Related to Tenon rule 152.
  This test reports visible pointer targets, i.e. labels, buttons, inputs, and links, that are small enough or near enough to other targets to make pointer interaction difficult. This test relates to WCAG 2.2 Success Criteria 2.5.5 and 2.5.8, but does not attempt to implement either of them precisely. For example, the test reports a small pointer target that is far from all other targets, although it conforms to the Success Criteria.
*/

// FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (page, catalog, withItems) => {
  // Return totals and standard instances for the rule.
  return await page.evaluate(withItems => {
    // Get all pointer targets.
    const allPTs = Array.from(document.body.querySelectorAll('label, button, input, a'));
    // Get the visible ones.
    const visiblePTs = allPTs.filter(pt => pt.checkVisibility({
      contentVisibilityAuto: true,
      opacityProperty: true,
      visibilityProperty: true
    }));
    // Initialize the data.
    const ptsData = [];
    // For each visible pointer target:
    visiblePTs.forEach(element => {
      // Get the coordinates of its centerpoint.
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      // Add them to the data.
      ptsData.push([centerX, centerY]);
    });
    // Initialize the counts of minor and major violations.
    let violationCounts = [0, 0];
    const instances = [];
    // For each visible pointer target:
    visiblePTs.forEach((element, index) => {
      const [centerX, centerY] = ptsData[index];
      const otherPTsData = ptsData.toSpliced(index, 1);
      // Get the minimum of the vertical distances of its centerpoint from those of the others.
      const minYDiff = Math.min(...otherPTsData.map(ptData => Math.abs(centerY - ptData[1])));
      // If it is close enough to make a violation possible:
      if (minYDiff < 44) {
        // Get the centerpoint coordinates of those within that vertical distance.
        const yNearPTsData = otherPTsData.filter(
          ptData => Math.abs(ptData[1] - centerY) < 44
        );
        // Get the minimum of their planar distances.
        const minPlanarDistance = Math.min(...yNearPTsData.map(ptData => {
          const planarDistance = Math.sqrt(
            Math.pow(centerX - ptData[0], 2) + Math.pow(centerY - ptData[1], 2)
          );
          return planarDistance;
        }));
        // If the minimum planar distance is less than 44px:
        if (minPlanarDistance < 44) {
          const isVeryNear = minPlanarDistance < 24;
          // Get the ordinal severity of the violation.
          const ordinalSeverity = isVeryNear ? 3 : 2;
          // Increment the applicable violation count.
          violationCounts[isVeryNear ? 1 : 0]++;
          // If itemization is required:
          if (withItems) {
            const what = `Pointer-target centerpoint is only ${Math.round(minPlanarDistance)}px from another one`;
            // Add an instance to the instances.
            instances.push(window.getInstance(element, 'targetSmall', what, 1, ordinalSeverity));
          }
        }
      }
    });
    // If itemization is not required:
    if (! withItems) {
      // If there were any major violations:
      if (violationCounts[1]) {
        const what = 'Pointer-target centerpoints are less than 24px from others';
        // Add a summary instance to the instances.
        instances.push(window.getInstance(null, 'targetSmall', what, violationCounts[1], 1));
      }
      // If there were any minor violations:
      if (violationCounts[0]) {
        const what = 'Pointer-target centerpoints are less than 44px from others';
        // Add a summary instance to the instances.
        instances.push(window.getInstance(null, 'targetSmall', what, violationCounts[0], 0));
      }
    }
    return {
      data: {},
      totals: [...violationCounts, 0, 0],
      standardInstances: instances
    };
  }, withItems);
};
