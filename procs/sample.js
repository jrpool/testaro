/*
  © 2023 CVS Health and/or one of its affiliates. All rights reserved.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  sample
  Draws a decreasingly index-weighted random sample.
*/

// FUNCTIONS

// Draws a location-weighted sample.
exports.getSample = (population, sampleSize) => {
  const popSize = population.length;
  // If the sample is smaller than the population:
  if (sampleSize < popSize) {
    // Assign to each individual a priority randomly decreasing with its index.
    const WeightedPopulation = population.map((item, index) => {
      const weight = 1 + Math.sin(Math.PI * index / popSize + Math.PI / 2);
      const priority = weight * Math.random();
      return [index, priority];
    });
    // Return the population indexes of the items in the sample, in ascending order.
    const sortedPopulation = WeightedPopulation.sort((a, b) => b[1] - a[1]);
    const sample = sortedPopulation.slice(0, sampleSize);
    const domOrderSample = sample.sort((a, b) => a[0] - b[0]);
    return domOrderSample.map(individual => individual[0]);
  }
  // Otherwise, i.e. if the sample is at least as large as the population:
  else {
    // Return the population indexes.
    return population.map((item, index) => index);
  }
};
