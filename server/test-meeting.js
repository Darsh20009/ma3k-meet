// Simple test to check meeting creation
const fetch = require('http').get || require('https').get;

const data = JSON.stringify({
  name: "اختبار بسيط",
  type: "اجتماع تجريبي"
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/meetings',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

console.log('Testing meeting creation...');
console.log('Request data:', data);

const req = require('http').request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  
  res.on('end', () => {
    console.log('Response body:', body);
    try {
      const parsed = JSON.parse(body);
      console.log('Parsed response:', JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log('Failed to parse JSON response');
    }
  });
});

req.on('error', (e) => {
  console.error(`Request error: ${e.message}`);
});

req.write(data);
req.end();