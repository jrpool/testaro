/*
  tenon
  This test processes a previously requested test by the Tenon API.
*/
const https = require('https');
// Wait until a time limit in seconds expires.
const wait = timeLimit => new Promise(resolve => setTimeout(resolve, 1000 * timeLimit));
exports.reporter = async (tenonData, id) => {
  if (tenonData && tenonData.accessToken && tenonData.requestIDs && tenonData.requestIDs[id]) {
    // Shared request options.
    const requestOptions = {
      host: 'tenon.io',
      path: `/api/v2/${tenonData.requestIDs[id]}`,
      port: 443,
      protocol: 'https:',
      headers: {
        Authorization: `Bearer ${tenonData.accessToken}`,
        'Cache-Control': 'no-cache'
      }
    };
    // Gets the test status.
    const getStatus = async () => {
      const testStatus = await new Promise((resolve, reject) => {
        requestOptions.method = 'HEAD';
        const statusRequest = https.request(requestOptions, statusResponse => {
          const {statusCode} = statusResponse;
          resolve(statusCode);
        });
        statusRequest.on('error', error => {
          console.log(`ERROR getting Tenon test status (${error.message})`);
          reject(`ERROR getting Tenon test status (${error.message})`);
        });
        statusRequest.end();
      });
      return testStatus;
    };
    // Gets the test result.
    const getResult = async () => {
      const testResult = await new Promise(resolve => {
        requestOptions.method = 'GET';
        const resultRequest = https.request(requestOptions, resultResponse => {
          let resultJSON = '';
          resultResponse.on('data', chunk => {
            resultJSON += chunk;
          });
          resultResponse.on('end', () => {
            try {
              const result = JSON.parse(resultJSON);
              resolve(result);
            }
            catch(error) {
              console.log(`ERROR getting Tenon test result (${resultJSON.slice(0, 80)} …)`);
              resolve({
                error: 'ERROR getting Tenon test result',
                resultStart: resultJSON.slice(0, 80)
              });
            }
          });
        });
        resultRequest.end();
      });
      return testResult;
    };
    // Get the test status (not reliable: may say 200 instead of 202).
    let testStatus = await getStatus();
    // If the test is still in the Tenon queue:
    if (testStatus === 202) {
      // Wait 5 seconds.
      await wait(5);
      // Get the test status again.
      testStatus = await getStatus();
    }
    // If the test has allegedly been completed:
    if (testStatus ===  200) {
      // Get the test result.
      let testResult = await getResult();
      // If the test is still in the Tenon queue:
      let {status} = testResult;
      if (status === 202) {
        // Wait 5 seconds.
        await wait(5);
        // Get the test result again.
        testResult = await getResult();
        // If the test is still in the Tenon queue:
        status = testResult.status;
        if (status === 202) {
          console.log('Waiting 15 seconds more for tenon result');
          // Wait 15 more seconds.
          await wait(15);
          // Get the test result again.
          testResult = await getResult();
          status = testResult.status;
        }
      }
      // If the test has really been completed:
      if (status === 200) {
        // Return its result.
        return {result: testResult};
      }
      // Otherwise, i.e. if the test is still running or failed:
      else {
        console.log('ERROR: tenon test incomplete or failed');
        return {
          result: {
            prevented: true,
            error: 'ERROR: tenon test incomplete or failed',
            status
          }
        };
      }
    }
    // Otherwise, if the test is still running after a wait for its status:
    else {
      // Report the test status.
      console.log('ERROR: tenon test incomplete');
      return {
        result: {
          prevented: true,
          error: 'ERROR: tenon test status not completed',
          testStatus
        }
      };
    }
  }
  else {
    console.log('ERROR: tenon authorization and test data incomplete');
    return {
      result: {
        prevented: true,
        error: 'ERROR: tenon authorization and test data incomplete'
      }
    };
  }
};
