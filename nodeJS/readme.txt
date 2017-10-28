Deployment to production
--------------------
- download and install latest node.js version v4.7.0
- download and install mysql 5.7 in the db server
- in the db server run mysql (mysql -u root):
	- create database magadeer CHARACTER SET utf8 COLLATE utf8_general_ci;
- install git (if not installed already)
- install pm2 (npm install pm2 -g)
- npm install -g sequelize-cli
- clone the repo
- set the host ip in config/db_config.json production "serverHost" parameter ex: "serverHost": "139.59.139.40:3000"
- set database username and password config/db_config.json production
- cd to the project repo
- npm install
- NODE_ENV=production pm2 start bin/magadeer --watch
- NODE_ENV=production sequelize db:seed:all
- to make sure that every thing is working fine "pm2 logs"



Localhost run
------------------
npm install -g nodemon
NODE_ENV=local nodemon bin/magadeer
NODE_ENV=local sequelize db:seed:all

dev server
------------------
ip: 46.101.246.207
username: root
password: ssh pass
ssh root@46.101.246.207

NODE_ENV=development nodemon bin/magadeer

NODE_ENV=development pm2 start bin/magadeer --watch
NODE_ENV=development sequelize db:seed:all

## First time to allow incomming traffic on port 3000:
sudo ufw status
sudo ufw allow 3000

Sequelize:
-----------------

Create seed file
sequelize seed:create --name file_name

Run all seeds
sequelize db:seed:all

