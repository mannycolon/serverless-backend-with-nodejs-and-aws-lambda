# serverless-backend-with-nodejs-and-aws-lambda

Configure aws

```bash
aws configure
```

## Serverless framework

```bash
npm install -g serverless

serverless

sls

sls create -h
```

## Deploy a Node.js function to AWS Lambda using the Serverless Framwork

Deploy

```bash
sls deploy
```

Once deployed, you can invoke the lambda function directly using:

```bash
sls invoke --function helloWorld
```

As expected, it returns "Hello World".

One cool feature about invoke is that you can also log out a debug statement. Let's try this by adding a `console.log`, redeploy our application.

```bash
module.exports.run = (event, context, callback) => {
  console.log("I'm a debug statement.")
  callback(null, "Hello World")
}
```

Deploy again to included update with new console log.

```bash
sls deploy
```

Then, invoke again the lambda function with the `--log` flag:

```bash
sls invode --function helloWorld --log
```

As an alternative, we also can run `sls logs`, which will just return the past logs:

`sls logs --function helloWorld`

Instead of using the callback function, we simply can return a Promise as well.

```js
module.exports.run = (event) => {
  return Promise.resolve('Hello');
};
```

Now we could redeploy the whole stack, but we are not going to do this, because what we are going to use is `sls deploy function`.

```bash
sls deploy function --function helloWorld
```

This is way faster, as it doesn't go for cloud formation, but instead just replaces the code ZIP for the specific function.

Once redeployed, we can `sls invoke --function helloWorld`, and see that it only returns "Hello".

Since Node 8 already supports async await, you also can declare a function as async and simply return the desired result.

```js
module.exports.run = async (event) => {
  return 'Hello again';
};
```

Redeploy

```bash
sls deploy function --function helloWorld
```

Invoke

```bash
sls invoke --function helloWorld
```

## Attach a HTTP endpoint to an AWS Lambda function using the Serverless Framework

The Serverless Framework allows us to attach an HTTP endpoint to our lambda function for an `event concept`. In its simplest version, we `define the path and the method`. By the way, by default lambdas can only be invoked using the SDK.

There are other AWS services like API Gateway that can invoke lambda and under the hood the framework actually is setting up an API Gateway for you, but abstracting away all the overhand.

serverless.yml

```yml
service: my-app

provider:
  name: aws
  runtime: nodejs8.10

functions:
  helloWorld:
    handler: handler.run
    events:
      - http:
          path:
          method: get
```

Once you start using the HTTP event, though, the expected response must be an object containing at least a `statusCode` as well as the `body`. In our case, we return a `JSON.stringify()` response.

handler.js

```js
module.exports.run = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Hello World',
    }),
  };
};
```

Now that everything is set up, we run `sls deploy` in the terminal. Note that in this case, we can't run `sls deploy function` since we changed some configuration. In this case, the API Gateway service needs to be set up. After the deploy succeeded, we can use `curl` to invoke the published endpoint.

```bash
curl https://lx2t8pikql.execute-api.us-east-1.amazonaws.com/dev/

{"message":"Hello world"}%
```
