DELIMITER $$
CREATE DEFINER=`ntang`@`%` PROCEDURE `GetRecent`()
BEGIN

SELECT
    *
FROM
    (SELECT
        'Person' AS TBL_SRC,
            Person.CHARNAME AS DESCRIPTION,
            Person.CREATE_DATE,
            Person.submitter
    FROM
        Person
    ORDER BY Person.CREATE_DATE DESC
    LIMIT 10) AS tblPerson
UNION SELECT
    *
FROM
    (SELECT
        'Lore' AS TBL_SRC,
            Lore.OBJECT_NAME AS DESCRIPTION,
            Lore.CREATE_DATE,
            Lore.submitter
    FROM
        Lore
    ORDER BY Lore.CREATE_DATE DESC
    LIMIT 10) AS tblLore
ORDER BY CREATE_DATE DESC;

END$$
DELIMITER ;
