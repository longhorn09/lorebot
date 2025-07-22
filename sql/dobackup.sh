#!/bin/bash
mysqldump --routines -h xxx.xxx.xxx.xxx -P 3306 --set-gtid-purged=OFF --single-transaction -u ntang -p --databases Lorebot > load_lorebot_db.sql

