module.exports = app => {
	const favoriteController = require("../controllers/favoriteController.js");

	app.get("/favorite", favoriteController.index);
	app.post("/getListFavorites", favoriteController.getListFavorites);
	app.post("/updateFavorite", favoriteController.updateFavorite);
	app.post("/deleteFavorite", favoriteController.deleteFavorite);
};