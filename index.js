var fs = require('fs');
var http = require('http');
var https = require('https');
var path = require('path');
const cors = require('cors');
const express = require("express");
var glob = require( 'glob' );

//import kurento from 'kurento-client';
const myEmitter = require('./helpers/event.js').eventBus;

var i18n = require("i18n");
i18n.configure({
	locales:['en', 'vi', 'jp'],
	directory: __dirname + '/locales',
	cookie: 'lang',
});

const config = require('./config/appConfig');

const options = {
    key: fs.readFileSync('./config/keys/server.key'),
    cert: fs.readFileSync('./config/keys/server.crt')
};

var app = express();
app.use(cors());
app.options('*', cors());
// parse requests of content-type - application/json
app.use(express.json());
// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'static')));
app.use(i18n.init);
app.set('views', path.join(__dirname, './views'));
app.set('view engine', 'ejs')

app.get('/', function (req, res) {
	res.redirect('/call');
});

glob.sync( './routes/*.js' ).forEach( function( file ) {
	require( path.resolve( file ) )(app);
});


var httpServer = http.createServer(app).listen(config.app.portHttp, () => {
	console.log("server: http://localhost:"+config.app.portHttp);
})

var httpsServer = https.createServer(options, app).listen(config.app.port, () => {
	console.log("server: https://localhost:"+config.app.port);
	myEmitter.emit("initStartSocket");
})

require("./handleSocket.js")(httpsServer);

//events
glob.sync( './events/*.js' ).forEach( function( file ) {
	require( path.resolve( file ) );
});