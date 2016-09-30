const uuid = require('node-uuid');
const conf = require('./config/conf');
const db = conf.db;
const Redis = require('ioredis');
const redis = new Redis({
    port: db.redis_port,
    host: db.redis_host,
    db: db.redis_db
});

var sampleTaskMaker = function(message, func, timeout) {
    message = JSON.stringify(message);
    console.log("Received a new task:", func, message, "after " + timeout + ".");

    // 这里的 uuid 是 npm 一个包
    // 生成一个唯一 uuid 的目的是为了防止两个任务用了相同的函数和参数，那么
    // 键名可能会重复并覆盖的情况
    // uuid 的文档为 https://www.npmjs.com/package/node-uuid
    //
    // 这里的 ❤️ 是一个分隔符，冒号是分割 uuid 和后面内容的，而 ❤️ 是分割函数名
    // 和消息的
    var key = uuid.v1().replace(/-/g, "") +
        ":❤️" + func + "❤️" + message;
    var content = "";

    redis.multi()
        .set(key, content)
        .expire(key, timeout)
        .exec(function(err) {
            if(err) {
                console.error("Failed to publish EXPIRE EVENT for " + content);
                console.error(err);
                return;
            }
            console.log("sdasdasd")
        });

    /*redis.set(key, '', 'EX', timeout, (err, result) => {
        if (err) {
            console.log(err);
        } else {
            console.log(result)
            console.log('create crontab status: ${result}');
        }
    });*/

};

exports = module.exports = sampleTaskMaker;