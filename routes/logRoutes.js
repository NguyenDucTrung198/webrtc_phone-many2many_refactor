module.exports = app => {
	const logController = require("../controllers/logController.js");

	app.get("/logs", logController.index);
	app.post("/getCallLogs", logController.getCallLogs);
	app.post("/saveFavorite", logController.saveFavorite);
};