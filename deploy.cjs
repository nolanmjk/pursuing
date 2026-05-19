const surge = require('surge');

console.log('Starting deployment...');
console.log('Email:', '3457443608@qq.com');

const opts = {
  login: { email: '3457443608@qq.com', password: 'Gk2026@help' },
  project: './dist',
  domain: 'gaokao-assistant-2026.surge.sh'
};

console.log('Options:', JSON.stringify({...opts, login: '***'}, null, 2));

surge(opts, (err, result) => {
  if (err) {
    console.error('Deploy error:', JSON.stringify(err, null, 2));
    process.exit(1);
  }
  console.log('Deploy result:', JSON.stringify(result, null, 2));
});
