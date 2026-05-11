#!/bin/bash
set -eo pipefail

# Initialize database if not exists
[ ! -d "/var/lib/mysql/mysql" ] && mysql_install_db --user=mysql --datadir=/var/lib/mysql --skip-test-db

# Create initialization SQL
cat > /tmp/init.sql <<-EOSQL
    CREATE DATABASE IF NOT EXISTS \`${MYSQL_DATABASE}\`;
    CREATE USER IF NOT EXISTS '${MYSQL_USER}'@'%' IDENTIFIED BY '${MYSQL_PASSWORD}';
    GRANT ALL PRIVILEGES ON \`${MYSQL_DATABASE}\`.* TO '${MYSQL_USER}'@'%';
	GRANT ALL ON *.* TO 'root'@'%' IDENTIFIED BY '${MYSQL_ROOT_PASSWORD}' WITH GRANT OPTION;
	GRANT ALL ON *.* TO 'root'@'localhost' IDENTIFIED BY '${MYSQL_ROOT_PASSWORD}' WITH GRANT OPTION;
    DELETE FROM mysql.user WHERE User='';
    FLUSH PRIVILEGES;
EOSQL

# Start MariaDB
exec mysqld --user=mysql --init-file=/tmp/init.sql --skip-name-resolve --skip-networking=0
