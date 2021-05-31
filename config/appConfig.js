

require('dotenv').config();

// config.js
module.exports = {
	app: {
		port: process.env.DEV_APP_PORT || 3000,
		portHttp: process.env.DEV_APP_HTTP_PORT || 3001,
		appName: process.env.APP_NAME || 'iLrn',
		env: process.env.NODE_ENV || 'development',
		recordPerPage: process.env.RECORD_PER_PAGE || 50,
		kurentoWsUri: process.env.KURENTO_WS_URI || 'ws://localhost:8888/kurento',
		timeoutCalling: process.env.TIMEOUT_CALLING || 30000
	},
	db: {
		port: process.env.DB_PORT || 5432,
		database: process.env.DB_NAME || 'sateraito',
		password: process.env.DB_PASS || '123456',
		username: process.env.DB_USER || 'root',
		host: process.env.DB_HOST || '127.0.0.1'
	},
	auth: {
		jwt_secret: process.env.JWT_SECRET || 'GJKLJDSFNGGHBBF76786HJHJKEDBJKH==',
		jwt_expiresin: process.env.JWT_EXPIRES_IN || '1d',
		saltRounds: process.env.SALT_ROUND || 10,
		//refresh_token_secret: process.env.REFRESH_TOKEN_SECRET || 'VmVyeVBvHTT2021d2VyZnVsbFNlY3JldA==',
		//refresh_token_expiresin: process.env.REFRESH_TOKEN_EXPIRES_IN || '2d', // 2 days
		refresh_token_size: 100
	}
};
