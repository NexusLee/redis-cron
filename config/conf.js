var sub_key = "__keyevent@0__:expired"

exports.sub_key = module.exports.sub_key = sub_key;

var db = {
    // redis 配置，默认是本地
    redis_host: '127.0.0.1',
    redis_port: 6379,
    redis_db: 0

}

exports.db = module.exports.db = db;
