### JS usage

```
var convert = require('mysql2gomodel')
var file = fs.readFileSync('schema.sql').toString()
console.log(convert(file))
```