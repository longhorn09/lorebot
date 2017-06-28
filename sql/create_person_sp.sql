CREATE DEFINER=`ntang`@`%` PROCEDURE `CreatePerson`(
    charName varchar(30),
    light varchar(100),
    ring1 varchar(100),
    ring2 varchar(100),
    neck1 varchar(100),
    neck2 varchar(100),
    body varchar(100),
    head varchar(100),
    legs varchar(100),
    feet varchar(100),
    arms varchar(100),
    slung varchar(100),
    hands varchar(100),
    shield varchar(100),
    about varchar(100),
    waist varchar(100),
    pouch varchar(100),
    rwrist varchar(100),
    lwrist varchar(100),
    weap1 varchar(100),
    weap2 varchar(100),
    held varchar(100),
    both_hands varchar(100),
    submitter varchar(100),
    clan_id int
)
BEGIN
	declare isExists int default 0 ;
    declare updateID int default -1;
	set isExists = (SELECT exists(select * from Person where Person.CHARNAME=charName));

    if (isExists > 0) then
		begin

			SET updateID = (SELECT Person.Person_ID FROM Person WHERE Person.CHARNAME=charName LIMIT 1);

            UPDATE Person
            SET Person.LIGHT=light,
				Person.RING1 = ring1,
                Person.RING2 = ring2,
                Person.NECK1 = neck1,
                Person.NECK2 = neck2,
                Person.BODY = body,
                Person.HEAD = head,
                Person.LEGS = legs,
                Person.FEET = feet,
                Person.ARMS = arms,
                Person.SLUNG = slung,
                Person.HANDS = hands,
                Person.SHIELD = shield,
                Person.ABOUT = about,
                Person.WAIST = waist,
                Person.POUCH = pouch,
                Person.RWRIST = rwrist,
                Person.LWRIST = lwrist,
                Person.PRIMARY_WEAP = weap1,
                Person.SECONDARY_WEAP = weap2,
                Person.HELD = held,
                Person.BOTH_HANDS = both_hands,
                Person.SUBMITTER = submitter,
				Person.CREATE_DATE = NOW(),
                Person.CLAN_ID = clan_id
            WHERE Person.PERSON_ID = updateID
            LIMIT 1;

        end;
	else
		INSERT INTO Person(CHARNAME,LIGHT,RING1,RING2,NECK1,NECK2,BODY,HEAD,LEGS,FEET,ARMS,SLUNG,HANDS,SHIELD,ABOUT,WAIST,POUCH,RWRIST,LWRIST,PRIMARY_WEAP,SECONDARY_WEAP,HELD,BOTH_HANDS,SUBMITTER,CLAN_ID)
        VALUES(charName, light, ring1, ring2, neck1, neck2, body, head, legs, feet, arms, slung, hands, shield, about, waist, pouch, rwrist, lwrist, weap1, weap2, held, both_hands, submitter, clan_id);
    end if;

END
