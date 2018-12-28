const https = require('https')

const requestDataFromUrl = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, (resp) => {
      let data = '';
      // A chunk of data has been received.
      resp.on('data', (chunk) => {
        data += chunk;
      });
      // The whole response has been received.
      resp.on('end', () => {
        let parsedData;
        try {
          parsedData = JSON.parse(data);
          resolve(parsedData);
        } catch (err) {
          err.context = { data }
          reject(err);
        }
      });
      // Response received an error?
      resp.on('error', reject);
    }).on("error", reject);
  });
}

module.exports = { requestDataFromUrl }
