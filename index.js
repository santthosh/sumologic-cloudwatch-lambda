/**
 * CloudWatch logs connector for SumoLogic through AWS Lambda
 *
 * Created by santthosh on 12/26/15.
 */

var zlib = require('zlib');
var config = require('config.json');
var request = require('request');

exports.handler = function(event, context) {
    var payload = new Buffer(event.awslogs.data, 'base64');
    zlib.gunzip(payload, function(e, result) {
        if (e) {
            context.fail(e);
        } else {
            result = JSON.parse(result.toString('utf8'));
            var lines = "";
            result.logEvents.forEach(function(log) {
                lines += log.timestamp + " name=" + result.logGroup + " stream="+ result.logStream + " message=" + log.message.replace(/\n$/g,'') + "\n";
            });
            console.log(lines);
            zlib.gzip(lines, function(err, zipped) {
                if (!err) {
                    request(
                        {
                            method: 'POST',
                            uri: config.sumologic.collector.url,
                            headers: {
                                'Content-Encoding': 'gzip',
                                'X-Sumo-Name': result.logGroup
                            },
                            body: zipped
                        }, function (error, response, body) {
                            if(response.statusCode == 200){
                                context.succeed("Successfully processed " + result.logEvents.length + " log events.");
                            } else {
                                context.fail(error);
                            }
                        }
                    )
                } else {
                    context.fail(err);
                }
            });
        }
    });
};