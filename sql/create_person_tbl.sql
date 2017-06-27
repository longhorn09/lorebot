drop table Person;
create table Person
(
  PERSON_ID int not null primary key auto_increment,
  CHARNAME varchar(100) not null,
  LIGHT varchar(100) default null,
  RING1 varchar(100) default null,
  RING2 varchar(100) default null,
  NECK1 varchar(100) default null,
  NECK2 varchar(100) default null,
  BODY  varchar(100) default null,
  HEAD  varchar(100) default null,
  LEGS  varchar(100) default null,
  FEET  varchar(100) default null,
  ARMS  varchar(100) default null,
  SLUNG  varchar(100) default null,
  HANDS  varchar(100) default null,
  SHIELD  varchar(100) default null,
  ABOUT  varchar(100) default null,
  WAIST  varchar(100) default null,
  POUCH  varchar(100) default null,
  RWRIST varchar(100) default null,
  LWRIST varchar(100) default null,
  PRIMARY_WEAP varchar(100) default null,
  SECONDARY_WEAP varchar(100) default null,
  HELD varchar(100) default null,
  BOTH_HANDS varchar(100) default null,
  SUBMITTER varchar(50) default null,
  CREATE_DATE datetime DEFAULT CURRENT_TIMESTAMP,
  CLAN_ID int default null
)
