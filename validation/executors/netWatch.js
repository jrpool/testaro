/*
  © 2022–2024 CVS Health and/or one of its affiliates. All rights reserved.
  © 2026 Jonathan Robert Pool.

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
process.env.NETWATCH_URL_JOB = 'http://localhost:3007/api/job';
process.env.NETWATCH_URL_REPORT = 'http://localhost:3007/api/report';
process.env.NETWATCH_AUTH_TYPE = 'header';
process.env.NETWATCH_WORKER_ID = 'testaro1';
process.env.NETWATCH_WORKER_SECRET = 'testarosecret';
const workerAuth = `Basic ${
  Buffer.from(`${process.env.NETWATCH_WORKER_ID}:${process.env.NETWATCH_WORKER_SECRET}`)
  .toString('base64')
}`;
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
  const {method, url} = request;
  const bodyParts = [];
  request.on('error', err => {
    console.error(err);
  })
  .on('data', chunk => {
    bodyParts.push(chunk);
  })
  .on('end', async () => {
    // If the authorization header is missing or wrong:
    if (request.headers.authorization !== workerAuth) {
      response.statusCode = 401;
      response.end(JSON.stringify({error: 'ERROR: Authorization invalid'}));
      return;
    }
    // If the request is a job request:
    if (method === 'POST' && url === '/api/job') {
      console.log('Server got a job request from Testaro');
      // If at least 7 seconds has elapsed since timing started:
      if (Date.now() > startTime + 7000) {
        // Respond with a job.
        const jobJSON = await fs.readFile(`${jobDir}/${jobID}.json`);
        response.end(jobJSON);
        console.log('Server sent job to Testaro');
        jobGiven = true;
      }
      // Otherwise, i.e. if timing started less than 7 seconds ago:
      else {
        // Send an empty-object response.
        response.end('{}');
      }
    }
    // Otherwise, if the request is a report submission:
    else if (method === 'POST' && url === '/api/report') {
      console.log('Server got report from Testaro');
      const ack = {};
      // If a job was earlier given to Testaro:
      if (jobGiven) {
        // Respond, reporting success or failure.
        try {
          const bodyJSON = bodyParts.join('');
          const body = JSON.parse(bodyJSON);
          if (body.report && body.report.acts && body.report.jobData) {
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
      else {
        ack.message = 'ERROR: Report submitted before a job was given';
      }
      const ackJSON = JSON.stringify(ack);
      response.end(ackJSON);
      console.log(`Server responded: ${ack.message}`);
      // This ends the validation, so stop the server.
      server.close();
      console.log('Server closed');
    }
    // Otherwise, i.e. if the request is neither:
    else {
      response.statusCode = 404;
      response.end(JSON.stringify({error: 'ERROR: Request invalid'}));
    }
  });
};
// Create a server.
server = client.createServer({}, requestHandler);
// Start a server listening for Testaro requests.
server.listen(3007, () => {
  console.log('Job and report server listening on port 3007');
});
