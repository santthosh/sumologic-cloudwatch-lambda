# CloudWatch logs connector for SumoLogic through AWS Lambda
Beam CloudWatch logs to SumoLogic using AWS Lambda

## Basics

### Requirements

* Have node.js installed
* Have an Amazon Web Services (AWS) Account
* Create an IAM role that has access to AWS Lambda, CloudWatch (make sure you modify package.json to set the same role name)

### Building

* `npm install` to install node modules

### Deploying

* Configure your AWS environment keys (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_ACCOUNT_ID)
* Modify config.json, add appropriate values as necessary
* `gulp deploy` to build and deploy this to your AWS Lambda environment. Check login function in your selected region

### Testing



