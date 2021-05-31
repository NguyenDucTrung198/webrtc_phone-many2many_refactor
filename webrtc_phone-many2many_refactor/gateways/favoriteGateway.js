const i18n = require('i18n')
const Logger = require('../helpers/logger');
const RequestHandler = require('../helpers/requestHandler');
const logger = new Logger();
const requestHandler = new RequestHandler(logger);

const FavoriteDbGateway = require("../gateways/databaseGateways/favoriteDbGateway.js");

exports.getListFavoritesResponse = async (participant, page) => {
    try {
        let listData = await FavoriteDbGateway.getListFavorites(participant, page);
        let totalPage = await FavoriteDbGateway.getTotalPageFavorites(participant);
        let dataResponse = {
            "list": listData,
            "total": totalPage
        }
        return requestHandler.sendSuccess(dataResponse);
    } catch( err) {
        return requestHandler.sendError(err);
    }
}

exports.updateFavoriteResponse = async (recordId, remove=false) => {
    let priority = 1;
    if (remove) {
        priority = 0;
    }
    const favorite = {
        priority: priority
    };
    try {
        let response = await FavoriteDbGateway.updateFavorite(recordId, favorite);
        return requestHandler.sendSuccess(response);
    } catch( err) {
        return requestHandler.sendError(err);
    }
}

exports.deleteFavoriteResponse = async (recordId, name, roomName) => {
    if (!recordId || !roomName || !name) return requestHandler.sendError("Missing params");;
    try {
        let response = await FavoriteDbGateway.deleteFavorite(recordId, name, roomName);
        return requestHandler.sendSuccess(response);
    } catch( err) {
        return requestHandler.sendError(err);
    }
}