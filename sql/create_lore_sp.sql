CREATE DEFINER=`ntang`@`%` PROCEDURE `CreateLore`(
	objName varchar(100),
    itemType varchar(30),
    itemIs varchar(80),
    submitter varchar(50),
    affects varchar(600),
    apply int,
    restricts varchar(200),
    weapClass varchar(20),
    matClass varchar(30),
    material varchar(40),
    itemValue varchar(10),
    extra varchar(2000),
    immune varchar(200),
    effects varchar(500),
    weight int,
    capacity int,
    itemLevel varchar(80),
    containerSize int,
    charges int,
    speed int,
    accuracy int,
    power int,
    damage varchar(7)

)
BEGIN
	declare isExists int default 0 ;
    declare updateID int default -1;
	set isExists = (SELECT exists(select * from Lore where Lore.OBJECT_NAME=objName));
    #select isExists;

    if (isExists > 0) then
		begin
			SET updateID = (SELECT Lore.LORE_ID FROM Lore WHERE Lore.OBJECT_NAME=objName LIMIT 1);
            #select updateID;
            UPDATE Lore
            SET Lore.ITEM_TYPE=itemType,
				Lore.ITEM_IS=itemIs,
				Lore.SUBMITTER = submitter,
                Lore.AFFECTS = affects,
                Lore.APPLY = apply,
                Lore.RESTRICTS = restricts,
				Lore.CREATE_DATE = NOW(),
                Lore.CLASS = weapClass,
                Lore.MAT_CLASS = matClass,
                Lore.MATERIAL = material,
                Lore.ITEM_VALUE = itemValue,
                Lore.EXTRA = extra,
                Lore.IMMUNE = immune,
                Lore.EFFECTS = effects,
                Lore.WEIGHT = weight,
                Lore.CAPACITY = capacity,
                Lore.ITEM_LEVEL = itemLevel,
                Lore.CONTAINER_SIZE = containerSize,
                Lore.CHARGES = charges,
                Lore.SPEED = speed,
                Lore.ACCURACY = accuracy,
                Lore.POWER = power,
                Lore.DAMAGE = damage
            WHERE Lore.LORE_ID = updateID
            LIMIT 1;
		end;
	else
		INSERT INTO Lore(OBJECT_NAME,ITEM_TYPE,ITEM_IS,SUBMITTER,AFFECTS,APPLY,RESTRICTS,CREATE_DATE,CLASS,MAT_CLASS,MATERIAL,ITEM_VALUE,EXTRA,IMMUNE,EFFECTS,WEIGHT,CAPACITY,ITEM_LEVEL,CONTAINER_SIZE,CHARGES,SPEED,ACCURACY,POWER,DAMAGE)
        VALUES(              objName,itemType ,itemIs ,submitter,affects,apply,restricts,NOW()  ,weapClass,matClass ,material, itemValue,extra,immune,effects,weight,capacity,itemLevel,containerSize,charges,speed,accuracy,power,damage);
	end if;
END
