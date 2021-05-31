Object.defineProperty(Error.prototype, 'toJSON', {
	value() {
	const alt = {};

	Object.getOwnPropertyNames(this).forEach(function (key) {
		alt[key] = this[key];
	}, this);

	return alt;
	},
	configurable: true,
	writable: true
});

let admin = require("firebase-admin");

var serviceAccount = require("./sateraito-phone-app-firebase-adminsdk-b2svl-77ae072395.json");


admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
	databaseURL: "https://phone-call-sateraito-app.firebaseio.com"
})

module.exports.admin = admin;
module.exports.pushConfig = 
{
    app_id: "a94c8572-8e94-4533-a0c0-c60c2c3396e9",
    onsignal_api_key: "OTI5ZjVkODYtM2Y3NS00OTFjLWI2YjItNzRmNDZlNTc0MWY2",
    voip_app_id: "61e836a1-93d6-488d-8ee7-f7b76dc7923c",
    voip_onsignal_api_key: "NTU1YTk4MzEtZDM1Mi00MTE4LTgzMDUtMDBiNDE3ZjFjZWY1"
}