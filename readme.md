# mysql2gomodel

mysql-scheme-convert-golang-model
mysql sql 结构转化成 golang model for gorm ...

### CLI usage Example

```
$ mysql2gomodel [input-file]

$ mysql2gomodel schema.sql > schema.go

----- print -----
package model

type CadModel struct {
  Id int32 `json:"id" gorm:"primary_key"`
  Name string `json:"name" gorm:"column:name"`
  Url string `json:"url" gorm:"column:url"`
  Img string `json:"img" gorm:"column:img"`
  Status int32 `json:"status" gorm:"column:status"`
  Dateline string `json:"dateline" gorm:"column:dateline"`
}
```

### JS usage

```
var convert = require('mysql2gomodel')
var file = fs.readFileSync('schema.sql').toString()
console.log(convert(file))
```
