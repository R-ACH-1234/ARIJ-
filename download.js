const https = require('https');
const fs = require('fs');

const file = fs.createWriteStream("public/logo.png");
https.get("https://f.top4top.io/s_3781y3o7d0.png", function(response) {
  response.pipe(file);
});
