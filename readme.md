# sql 结构转 gorm model

把 sql 创建语句转成 gorm model


### install

npm i -g sql-to-gorm

### CLI usage Example

```
# 打印
$ sql-to-gorm [input-file]

# 写入文件
$ sql-to-gorm schema.sql > schema.go


----- print -----
package model

type TaskSyncPaopaoTwitterModel struct {
	Id         int32  `json:"id" gorm:"column:id;int(11) unsigned;comment:'自增id'"`
	Username   string `json:"username" gorm:"column:username;varchar(50);default:NULL"`
	Nickname   string `json:"nickname" gorm:"column:nickname;varchar(80);default:NULL"`
	LastPostId int64  `json:"last_post_id" gorm:"column:last_post_id;bigint(20);default:'0';comment:'泡泡最后id'"`
	Bucket     string `json:"bucket" gorm:"column:bucket;varchar(30);default:NULL"`
	ObjectDir  string `json:"object_dir" gorm:"column:object_dir;varchar(80);default:NULL"`
	Status     int32  `json:"status" gorm:"column:status;tinyint(2);default:'1';comment:'1:on 0 :off'"`
	Dateline   string `json:"dateline" gorm:"column:dateline;datetime;default:NULL"`
}

func (TaskSyncPaopaoTwitterModel) TableName() string {
	return "task_sync_paopao_twitter"
}

```


