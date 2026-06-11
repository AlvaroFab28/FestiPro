const fs = require('fs');
let f = fs.readFileSync('c:/laragon/www/festipro-web/src/pages/publico/catalogo/catalogo.js', 'utf8');
f = f.replace(/\\\`/g, '`').replace(/\\\${/g, '${');
fs.writeFileSync('c:/laragon/www/festipro-web/src/pages/publico/catalogo/catalogo.js', f);
console.log('Fixed syntax errors');
