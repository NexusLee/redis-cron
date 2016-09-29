'use strict'
const Redis = require('ioredis');
const conf = require('./config/conf');
const sub_key = conf.sub_key;
const db = conf.db;
//var db = require("./config/db");
let sampleTask = require('./sampleTaskMaker.js');
const redis = new Redis({
    port: db.redis_port,
    host: db.redis_host,
    db: db.redis_db
});
const sub = new Redis({
    port: db.redis_port,
    host: db.redis_host,
    db: db.redis_db
});

sub.once('connect', () => {
    sub.subscribe(sub_key, (err, count) => {
        if (err) {
            console.log(err)
            handleError(err);
        } else {
            console.log('subscription success, subscription count is: ${count}');
            // 创建发邮件的定时任务
            createCrontab('sendMail', ['787188993@qq.com'], 5);
            //sampleTask('sendMail', ['787188993@qq.com'], 5)
        }
    });

    // 监听消息
    sub.on('message', sampleOnExpired);

    sub.on('disconnect', function(){
        sub.removeListener('message', function(){

        });
    })

});

/* 生产唯一id
 * @return {String} uid 唯一id值 
 */

let genUID = (() => {
    let num = 0;

    function getIncNum() {
        if (num >= 10000) num = 0;
        return '0'.repeat(4 - String(num).length) + num++;
    }

    return () => {
        return Date.now() + getIncNum();
    };
})();

/* 创建定时任务
 * @param {String} fn 函数名
 * @param {Array} args 函数参数
 * @timeout {Number} timeout 过期时间
 */

function createCrontab(fn, args, timeout) {
    // 添加唯一id的原因是应对同一毫秒，同函数同参数的key，会进行覆盖
    const cron_key = '${genUID()}:${fn}:${JSON.stringify(args)}';
    //redis.config('set', 'notify-keyspace-events', 'KEA')

    // 设置定时任务
    redis.set(cron_key, '', 'EX', timeout, (err, result) => {
        if (err) {
            handleError(err);
        } else {
            console.log(result)
            console.log('create crontab status: ${result}');
        }
    });
}

/* 定时任务触发器
 * @param {String} channel 订阅频道
 * @param {String} key 定时任务的键
 */

function crontabTrigger(channel, key) {
console.log(channel)
console.log(key)
    const fileds = key.split(':');
    if (fileds.length < 3) return;

    // 去掉key的uid
    fileds.shift();
    // 获取函数名
    const fn_name = fileds.shift();
    
    // 获取函数参数
    // 如果剩余字段数大于1，说明参数中有带':'的参数，需要重新拼接回去
    // 字段数等于1时,join后返回原数组第一个元素
    let args = fileds.join(':');

    try {
    	// 解析函数参数, 多参数时, args为数组
        args = JSON.parse(args);
    } catch (e) {
    	handleError(e);
    }

    console.log('---------------%s : %s--------------',fn_name, args);

    // 获取函数
    //const fn = tasks[fn_name];
   	// 执行函数
   	//fn(...args);
}


function sampleOnExpired(channel, key) {
    console.log(channel)
    console.log(key)
    // UUID:❤️func❤️params
    var body = key.split("❤️");
    if(body.length < 3) return;

    // 取出 body 第一位爲 func
    var func = body[1];

    // 推出前兩位，後面剩下的有可能是參數裏面自帶 ❤️ 而被分割，所以要拼回去
    body.shift(); body.shift();
    var params = body.join("❤️");

    // 然後把 params 傳入 func 去執行
    // func:
    //   path1/path2.func
    func = func.split(".");
    if(func.length !== 2) {
        console.error("Bad params for task:", func.join("."), "-", params);
        return;
    }

    var path = func[0];
    func = func[1];

    var mod;
    try {
        mod = require("./tasks/" + path);
    } catch(e) {
        console.error("Failed to load module", path);
        console.error(e.stack);
        return;
    }

    process.nextTick(function() {
        try {
            mod[func].apply(null, JSON.parse(params));
        } catch(e) {
            console.error("Failed to call function", path, "-", func, "-", params);
            console.error(e.stack);
        }
    });
};

/* 错误处理函数
 * @param {Error} err 错误对象
 */

function handleError(err) {
    console.log(err);
    process.exit(1);
}
