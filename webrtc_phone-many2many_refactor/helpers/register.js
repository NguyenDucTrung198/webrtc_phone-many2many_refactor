

/**
 * 
 */
class Register {

    /**
     * 
     */
    constructor() {
        this.usersByName = {};
        this.userSessionIds = {};
    }

    /**
     * register
     * 
     * @param {object} user 
     */
    register(user) {
        if (!this.usersByName[user.name]) {
            this.usersByName[user.name] = [];
        }
        (this.usersByName[user.name]).push(user);
        //this.usersByName[user.name] = user;
        this.userSessionIds[user.id] = user;
    }

    /**
     * 
     * @param {string} name
     */
    unregister(id) {
        let user = this.getById(id);
        if (user) {
            delete this.userSessionIds[id];
            let users = this.getByName(user.name);
            this.usersByName[user.name] = users.filter(function( obj ) {
                return obj.id !== id;
            });
            if (!(this.usersByName[user.name]).length) {
                delete this.usersByName[user.name];
            }
        }
    }

    /**
     * 
     * @param {*} name
     */
    removeByName(name) {
        let user = this.getByName(name);
        if (user) {
            delete this.usersByName[user.name];
            delete this.userSessionIds[user.id];
        }
    }

    /**
     * 
     * @param {string} name 
     */
    getByName(name) {
        return this.usersByName[name];
    }

    getById(id) {
        return this.userSessionIds[id];
    }
}

module.exports = Register
