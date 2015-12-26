/**
 * CloudWatch logs connector for SumoLogic through AWS Lambda
 *
 * Created by santthosh on 12/26/15.
 */

var zlib = require('zlib');
exports.handler = function(event, context) {
    var payload = new Buffer(event.awslogs.data, 'base64');
    zlib.gunzip(payload, function(e, result) {
        if (e) {
            context.fail(e);
        } else {
            result = JSON.parse(result.toString('utf8'));
            console.log("Decoded payload: ", JSON.stringify(result));
            context.succeed("Successfully processed " + result.logEvents.length + " log events.");
        }
    });
};