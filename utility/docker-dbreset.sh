#!/bin/bash
docker exec db sh -c 'mysql -u root -prootpassword Lorebot < /lorebot/sql/load_lorebot_db.sql'


