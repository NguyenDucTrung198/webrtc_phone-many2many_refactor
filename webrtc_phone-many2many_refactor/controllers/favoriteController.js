const FavoriteGateway = require("../gateways/favoriteGateway");
//const { response } = require("express");

// Create and Save a new Customer
exports.index = async (req, res) => {
	res.render('favorite', {});
};

exports.getListFavorites = async (req, res) => {
    let name = req.body.name;
    let page = parseInt(req.body.page);
    let {status, dataResponse} = await FavoriteGateway.getListFavoritesResponse(name, page);
	res.status(status).send(dataResponse);
}

exports.updateFavorite = async (req, res) => {
    let recordId = req.body.id;
    let remove = req.body.remove;
    let {status, dataResponse} = await FavoriteGateway.updateFavoriteResponse(recordId, remove);
	res.status(status).send(dataResponse);
}

exports.deleteFavorite = async (req, res) => {
    let recordId = req.body.id;
    let name = req.body.name;
    let roomName = req.body.roomName;
    let {status, dataResponse} = await FavoriteGateway.deleteFavoriteResponse(recordId, name, roomName);
	res.status(status).send(dataResponse);
}