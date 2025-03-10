/** Returns a formatted CrudResponse object for easy use with routers. */
const crudResponse = (code = 200, info = {}) => {
    if (typeof info === 'string') {
        info = { message: info };
    }
    return { code, info };
};

module.exports = crudResponse;
