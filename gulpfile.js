var gulp = require('gulp');
var gutil = require('gulp-util');
var del = require('del');
var install = require('gulp-install');
var zip = require('gulp-zip');
var fs = require('fs');
var AWS = require('aws-sdk');
var runSequence = require('run-sequence');
var packageDefinition = require('./package.json');

// Clean out the dist folder and remove the compiled zip file.
gulp.task('clean', function(cb) {
    del('./dist',
        del('./dist.zip', cb)
    );
});

gulp.task('js', function() {
    return gulp.src(['index.js','config.json'],{'base':'.'})
        .pipe(gulp.dest('dist/'))
});

// Install npm packages to dist, ignoring devDependencies.
gulp.task('npm', function() {
    return gulp.src('./package.json')
        .pipe(gulp.dest('./dist/'))
        .pipe(install({production: true}));
});

// Zip the dist directory
gulp.task('zip', function() {
    return gulp.src(['dist/**/*', '!dist/package.json', 'dist/.*'])
        .pipe(zip('dist.zip'))
        .pipe(gulp.dest('./'));
});

// Per the gulp guidelines, we do not need a plugin for something that can be
// done easily with an existing node module. #CodeOverConfig
//
// Note: This presumes that AWS.config already has credentials. This will be
// the case if you have installed and configured the AWS CLI.
//
// See http://aws.amazon.com/sdk-for-node-js/
gulp.task('upload', function() {
    AWS.config.update({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        "region": "us-west-2"
    });

    var lambda = new AWS.Lambda();
    var functionName = packageDefinition.lambda.name;
    var handler = packageDefinition.lambda.handler;
    var role = packageDefinition.lambda.role;

    lambda.getFunction({FunctionName: functionName}, function(err, data) {
        if (err) {
            console.log(err);
            if (err.statusCode === 404) {
                var warning = 'Unable to find lambda function ' + functionName + '. Attempting to create it..';
                gutil.log(warning);
                var params = {
                    Code: {
                        ZipFile: fs.readFileSync('./dist.zip')
                    },
                    FunctionName: functionName,
                    Handler: handler,
                    Role: 'arn:aws:iam::' + process.env.AWS_ACCOUNT_ID + ':role/' + role,
                    Runtime: 'nodejs',
                    Description: packageDefinition.description,
                    MemorySize: 128,
                    Timeout: 300
                };
                lambda.createFunction(params, function(err, data) {
                    if (err) gutil.log(err, err.stack); // an error occurred
                    else     gutil.log(data);           // successful response
                });

            } else {
                var warning = 'AWS API request failed. ';
                warning += 'Check your AWS credentials and permissions.';
                gutil.log(warning);
            }
        } else {
            // This is a bit silly, simply because these five parameters are required.
            var current = data.Configuration;
            var params = {
                FunctionName: functionName,
                ZipFile: fs.readFileSync('./dist.zip')
            };

            lambda.updateFunctionCode(params, function(err, data) {
                if (err) {
                    var warning = 'Package upload failed. ';
                    warning += 'Check your iam:PassRole permissions.';
                    gutil.log(warning);
                } else {
                    gutil.log(data);
                }
            });
        }
    });
});

// The key to deploying as a single command is to manage the sequence of events.
gulp.task('deploy', function(callback) {
    return runSequence(
        'clean',
        'npm',
        'js',
        'zip',
        'upload',
        callback
    );
});