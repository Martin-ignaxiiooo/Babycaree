const https = require('https');

https.get('https://babycare-backend-msyq.onrender.com/api/logs', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log("LOGS:\n", data));
}).on('error', (err) => console.log("Error:", err.message));
