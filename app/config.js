require('dotenv').config();

module.exports = {
	secretKey: '0c95cfbe812bb3eeb3afdca3c4256953',
	host: process.env.DB_HOST,
	port: process.env.DB_PORT,
	database: process.env.DB_DATABASE,
	user: process.env.DB_USERNAME,
	password: process.env.DB_PASSWORD,
}