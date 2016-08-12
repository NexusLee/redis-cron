var db = require("./config/db");
var Redis = require("ioredis");

var client = new Redis({
    port: db.redis_port,
    host: db.redis_host,
    db: db.redis_db
});

exports = module.exports = client;