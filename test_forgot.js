const https = require('https');

const data = JSON.stringify({ email: 'babyyycareee@gmail.com' });

const options = {
  hostname: 'babycare-backend-msyq.onrender.com',
  port: 443,
  path: '/api/auth/forgot-password',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, res => {
  console.log(`statusCode: ${res.statusCode}`);
  let body = '';
  res.on('data', d => { body += d; });
  res.on('end', () => { console.log('Response:', body); });
});

req.on('error', error => { console.error(error); });
req.write(data);
req.end();
