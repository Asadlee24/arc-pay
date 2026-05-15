const https = require('https');

function getBase64(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = [];
      res.on('data', (chunk) => data.push(chunk));
      res.on('end', () => {
        let buffer = Buffer.concat(data);
        resolve(buffer.toString('base64'));
      });
    }).on('error', reject);
  });
}

(async () => {
  try {
    const mm = await getBase64('https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Logo.svg');
    const okx = await getBase64('https://www.okx.com/cdn/assets/imgs/221/9E6F564F10204780.png');
    console.log('---MM---');
    console.log(mm);
    console.log('---OKX---');
    console.log(okx);
  } catch (e) {
    console.error(e);
  }
})();
