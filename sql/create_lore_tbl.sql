drop table Lore;
create table Lore
(
LORE_ID int not null primary key auto_increment,
OBJECT_NAME varchar(100),   #
ITEM_TYPE varchar(30), # treasure
ITEM_IS varchar(80),#
SUBMITTER varchar(50),#
AFFECTS varchar(600),#
APPLY int,#
RESTRICTS varchar(200),#
CREATE_DATE datetime,
CLASS varchar(20),	#hammer
MAT_CLASS varchar(30),# metal
MATERIAL varchar(40), #steel
ITEM_VALUE varchar(10),#
EXTRA varchar(2000),#
IMMUNE varchar(200),#
EFFECTS varchar(500),#
WEIGHT int,#
CAPACITY int,#
ITEM_LEVEL varchar(80), # Level
CONTAINER_SIZE int, #Contains
CHARGES INT,#
SPEED INT,#
ACCURACY INT,#
POWER INT, #2 digit numbers
DAMAGE varchar(7) #100d100

);
  #drop table Lore
/*
{
  "Object": 294,
  "Item Type": 15,
  "Item is": 63,
  "Submitter": 21,
  "Affects": 490,
  "Apply": 3,
  "Restricts": 126,
  "Time": 24,
  "Mat Class": 12,
  "Material": 23,
  "Value": 8,
  "Extra": 1676,
  "Immune": 150,
  "Effects": 95,
  "Weight": 6,
  "Class": 16,
  "Damage": 4,
  "Speed": 2,
  "Power": 14,
  "Level": 47,
  "Contains": 2,
  "Accuracy": 2,
  "Charges": 2,
  "Capacity": 2
}
*/
