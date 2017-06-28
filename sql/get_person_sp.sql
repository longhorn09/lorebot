DELIMITER $$
CREATE DEFINER=`ntang`@`%` PROCEDURE `GetPerson`(
    charName varchar(30)	)
BEGIN
	select *
    from Person
    where Person.CharName=charName;
END$$
DELIMITER ;
