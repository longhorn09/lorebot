DELIMITER $$
CREATE DEFINER=`ntang`@`%` PROCEDURE `GetLoreObj`(
	objName varchar(200)
)
BEGIN
	select * from Lore
    where Lore.OBJECT_NAME=objName;

END$$
DELIMITER ;
