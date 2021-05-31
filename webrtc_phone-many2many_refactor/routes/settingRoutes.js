module.exports = app => {
	const settings = require("../controllers/settingController.js");

	app.get("/setting", settings.index);
    app.post("/saveSettings", settings.saveSettings);
    app.get("/getSettings", settings.getSettings);
};