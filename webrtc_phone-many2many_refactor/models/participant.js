const Register = require("../helpers/register");
const Session = require("../helpers/session");

let userRegister = new Register();

exports.register = (socket, name) => {
    let userSession = new Session(socket, name);
    userRegister.register(userSession);
    return userSession;
}

exports.getById = (soceketId) => {
    return userRegister.getById(soceketId)
}

exports.getByName = (name) => {
    return userRegister.getByName(name);
}
