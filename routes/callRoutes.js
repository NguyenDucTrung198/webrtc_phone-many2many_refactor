module.exports = app => {
	const callController = require("../controllers/callController");

	app.get("/call", callController.index);
	app.post("/checkCalling", callController.checkCalling);
	app.post("/saveReasonReject", callController.saveReasonReject);
	app.post("/saveToken", callController.saveToken);
};