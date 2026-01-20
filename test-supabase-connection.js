// Test if we can reach Supabase API
const https = require('https');

console.log('Testing Supabase API connection...');

const options = {
  hostname: 'api.supabase.com',
  port: 443,
  path: '/v1/projects',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer sbp_f69af6d690c08d8cf56015a449ee857efde02176'
  }
};

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log('Connection successful!');
  
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Response received');
  });
});

req.on('error', (error) => {
  console.error('Connection failed:', error.message);
  console.error('Error code:', error.code);
  
  if (error.code === 'ENOTFOUND') {
    console.log('\n❌ DNS resolution failed - check your internet/DNS settings');
  } else if (error.code === 'ECONNREFUSED') {
    console.log('\n❌ Connection refused - firewall may be blocking');
  } else if (error.code === 'ETIMEDOUT') {
    console.log('\n❌ Connection timeout - may need VPN or proxy');
  }
});

req.setTimeout(10000, () => {
  console.error('\n❌ Request timeout - check VPN/proxy settings');
  req.destroy();
});

req.end();
