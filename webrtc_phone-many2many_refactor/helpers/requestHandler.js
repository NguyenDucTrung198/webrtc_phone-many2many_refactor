const _ = require('lodash');

class RequestHandler {
	constructor(logger) {
		this.logger = logger;
	}

	throwIf(fn, status, errorType, errorMessage) {
		return result => (fn(result) ? this.throwError(status, errorType, errorMessage)() : result);
	}

	validateJoi(err, status, errorType, errorMessage) {
		if (err) { this.logger.log(`error in validating request : ${errorMessage}`, 'warn'); }
		return !_.isNull(err) ? this.throwError(status, errorType, errorMessage)() : '';
	}

	throwError(status, errorType, errorMessage) {
		return (e) => {
			if (!e) e = new Error(errorMessage || 'Default Error');
			e.status = status;
			e.errorType = errorType;
			throw e;
		};
	}

	catchError(error , data={}) {
		if (!error) error = new Error('Default error');
		return {
            status: error.status || 500 ,
            dataResponse: { error: error.message || 'Unhandled error', data: data }
        };
	}

	sendSuccess(data={}, status) {
		this.logger.log(`a request has been made and proccessed successfully at: ${new Date()}`, 'info');
        if (_.isUndefined(status)) {
            status = 200;
        }
        return {
            status: status, 
            dataResponse: {
                error: '', data: data
            }
        };
	}

	sendError(message, dataResponse={}, status=500) {
		this.logger.log(`error details message: ${message}`, 'error');
		return {
            status: status, 
            dataResponse: {
			    error: message || 'Unhandled Error', data: dataResponse
            }
        }
	}
}
module.exports = RequestHandler;