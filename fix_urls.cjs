const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
html = html.replace(/https:\/\/f\.top4top\.io\/s_3781y3o7d0\.png/g, '/logo.png');
fs.writeFileSync('index.html', html);

let manifest = fs.readFileSync('public/manifest.json', 'utf8');
manifest = manifest.replace(/https:\/\/f\.top4top\.io\/s_3781y3o7d0\.png/g, '/logo.png');
fs.writeFileSync('public/manifest.json', manifest);
