database schema:
```
create database theshares;

use theshares;

create table user_profile(
first_name varchar(20) not null,
last_name varchar(20) not null,
profile_pic varchar(100),
status int not null default 0,
uid int not null unique,
phone varchar(100) ,
doj timestamp not null default current_timestamp,
dob varchar(10),
email varchar(50) not null unique,
primary key(uid));

drop table users;


create table users(
email varchar(50) not null unique,
password varchar(400),
uid int not null auto_increment,
en_email varchar(100) not null,
mode int not null,
primary key(uid));

create table unofficial_article_table (
aid int not null auto_increment,
title varchar(50) not null unique,
contributor_id int not null,
date_of_submission timestamp not null default current_timestamp,
last_update timestamp,
status int not null,
tags varchar(150) not null,
path_of_directory_on_server varchar(400) not null,
paid int,
primary key(aid));

create table published_articles(
contributor_id int not null,
p_aid int not null auto_increment,
aid int not null unique,
date_of_publication timestamp default current_timestamp,
last_update_date timestamp,
tags varchar(150) not null,
status int not null default 1,
path_of_directory_on_server varchar(400) not null,
title varchar(50) not null unique,
primary key(p_aid));

create table articles_publish_records(
sno int not null auto_increment,
aid int not null,
p_aid int not null,
contributor_id int not null,
publisher_id int not null,
date_of_publish timestamp default current_timestamp,
primary key(sno));

create table admin_table(
admin_id int not null auto_increment,
full_name varchar(50) not null,
power_value int not null,
password varchar(500) not null,
date_of_join timestamp default current_timestamp,
primary key(admin_id));

create table article_verification_panel_session (
expires bigint not null,
session_id varchar(100) not null,
data longtext not null);   

```


#### Article statuses:
-2 = discarded by admin
-1 = deleted by user
0 = under review
1 = published
2 = resend for resolving issues

thanks
