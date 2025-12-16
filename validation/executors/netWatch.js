/*
  © 2022–2024 CVS Health and/or one of its affiliates. All rights reserved.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  watchNet.js
  Validator for network watching.
*/

// IMPORTS

const fs = require('fs/promises');

// CONSTANTS

// Override netWatch environment variables with validation-specific ones.
const jobDir = `${__dirname}/../jobs/todo`;
process.env.JOB_URLS = 'http://localhost:3007/api/job';
process.env.AGENT = 'testarauth';
const {netWatch} = require('../../netWatch');
const client = require('http');
const jobID = '240101T1200-simple-example';

// OPERATION

// Start a timer.
const startTime = Date.now();
// Initialize the state.
let jobGiven = false;
// Start checking for jobs every 5 seconds in 5 seconds.
setTimeout(() => {
  netWatch(false, 5, false);
}, 5000);
let server;
// Handles Testaro requests to the server.
const requestHandler = (request, response) => {
  const {method} = request;
  const bodyParts = [];
  request.on('error', err => {
    console.error(err);
  })
  .on('data', chunk => {
    bodyParts.push(chunk);
  })
  .on('end', async () => {
    // Remove any trailing slash from the URL.
    const requestURL = request.url.replace(/\/$/, '');
    // If the request method is GET:
    if (method === 'GET') {
      // If a job is validly requested:
      console.log('Server got a job request from Testaro');
      if (requestURL === `/api/job?agent=${process.env.AGENT}`) {
        // If at least 7 seconds has elapsed since timing started:
        if (Date.now() > startTime + 7000) {
          // Respond with a job.
          const jobJSON = await fs.readFile(`${jobDir}/${jobID}.json`);
          await response.end(jobJSON);
          console.log('Server sent job to Testaro');
          jobGiven = true;
        }
        // Otherwise, i.e. if timing started less than 7 seconds ago:
        else {
          // Send an empty-object response.
          await response.end('{}');
        }
      }
      else {
        const error = {
          error: 'ERROR: Job request invalid'
        };
        const errorJSON = JSON.stringify(error);
        await response.end(errorJSON);
      }
    }
    // Otherwise, if the request method is POST:
    else if (method === 'POST') {
      console.log('Server got report from Testaro');
      const ack = {};
      // If a report is validly submitted:
      if (requestURL === '/api') {
        // If a job was earlier given to Testaro:
        if (jobGiven) {
          // Respond, reporting success or failure.
          try {
            const bodyJSON = bodyParts.join('');
            const body = JSON.parse(bodyJSON);
            if (
              body.acts
              && body.sources
              && body.sources.agent
              && body.sources.agent === process.env.AGENT
            ) {
              ack.message = 'Success: Valid report submitted';
            }
            else {
              ack.message = 'Failure: Report invalid';
            }
          }
          catch(error) {
            ack.message = `ERROR: ${error.message}`;
          }
        }
      }
      else {
        ack.message = 'ERROR: Report submission invalid';
      }
      const ackJSON = JSON.stringify(ack);
      response.end(ackJSON);
      console.log(`Server responded: ${ack.message}`);
      // This ends the validation, so stop the server.
      server.close();
      console.log('Server closed');
    }
  });
};
// Create a server.
server = client.createServer({}, requestHandler);
// Start a server listening for Testaro requests.
server.listen(3007, () => {
  console.log('Job and report server listening on port 3007');
});
