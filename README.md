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

## Deploy a DynamoDB table to AWS using the Serverless Framework

In order to store data, we need a database. One convenient way of doing so in AWS is DynamoDB. To add a DynamoDB table, we can leverage the resources section in the `serverless.yml`. It allows us to add raw cloud formation `Resources`.

Just for clarification, why we need to nest resources twice here, it has to be nested because cloud formation also supports other keywords, like output and input. Next up, we define a resource name: `TodosTable:`, and inside set the `Type: 'AWS::DynamoDB::Table'`.

In the minimum configuration, a table needs to have a couple of `Properties` defined, the `TableName`, the `AttributesDefinitions` used for primary and secondary indexes. In our case, we have an id of type String, `S`. Then we add a `KeySchema` and define the `AttributesName` that make up the primary key for our table. In our case, this is the field `id`.

Keep in mind, in the table we can still store other attributes, like text or createdAt. It's not necessary to define them here. It's only mandatory to define those used for the KeySchema.

Last but not least, we define the `ProvisionedThroughput` capacity for read and write. In our case, one is sufficient. In case you need to scale, I recommend you to activate autoscaling for the DynamoDB table.

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

resources:
  Resources:
    TodosTable:
      Type: AWS::DynamoDB::Table
      Properties:
        TableName: todos
        AttributeDefinitions:
          - AttributeName: id
            AttributeType: S
        KeySchema:
          - AttributeName: id
            KeyType: Hash
        ProvisionedThroughput:
          ReadCapacityUnits: 1
          WriteCapacityUnits: 1
```

Then we run `sls deploy`, and cloud formation will set up our table.

Let's switch over to the console. As we can see, the table exists now.

## Deploy an AWS Lambda function to store data in DynamoDB using the Serverless Framework

In order to store data into a DynamoDB table we first need to setup the permissions for the Lambda function to have write access. Further we can use the DocumentClient API shipping with AWS to write the data coming from a request to the DynamoDB table.

Using a lambda function, we want to write data to a DynamoDB table. We remove our `helloWorld`, including its `handler`, and create a new one called `createTodo`. We provide the `handler` and the `http` event.

There is one thing missing, though, in this configuration to make it work. By default, a lambda function is not allowed to interact with the table. We need to give our lambda functions access. To do so, we need to use an identity and access management, short `iamRole`.

Under the hood, the serverless framework already attaches an `iamRole`. Using the `iamRoleStatements` syntax, we can extend the permissions for this specific `iamRole`. We allow that our functions can execute the `action` `dynamodb:PutItem` on our table resource.

The `Resource` has to be provided as an Amazon resource name, or short `arn`. For DynamoDB, it starts with `arn:aws:`, then the service, the region, the account ID, resource time, and the resource. While in examples you'll often see an asterisk used as a wildcard, I recommend you to lock down the permissions as much as possible for a tighter security.

serverless.yml

```yml
service: my-app

provider:
  name: aws
  runtime: nodejs8.10
  iamRoleStatements:
    - Effect: Allow
      Action:
        - dynamodb:PutItem
      Resource: 'arn:aws:dynamodb:us-east-1:853182604221:table/todos'
```

Now, we are missing our handler. Let's create the file, `create.js`.

```bash
my-app touch create.js
```

In there, we add our function. Here, we can pass the provided body as `JSON`, and `return` a response.

create.js

```js
module.exports.run = async (event) => {
  const data = JSON.parse(event.body);
  return {
    statusCode: 200,
    body: JSON.stringify(data),
  };
};
```

In order to interact with DynamoDB, we can import `const AWS = require("aws-sdk");`, and instantiate the document client, `const client = new AWS.DynamoDB.documentClient();`. There is no need to install it, since the lambda ships with it. We create the parameters, `params` for DynamoDB put, containing `TableName:`, and the `Item:` we want to store.

Then we invoke `put` on the `client` with these parameters. We use `await` to make sure the code doesn't proceed until the request finished successfully. In case of a failure, the function would arrow with a status code 500.

```js
const AWS = require('aws-sdk');

const client = new AWS.DynamoDB.documentClient();

module.exports.run = async (event) => {
  const data = JSON.parse(event.body);
  const params = {
    TableName: 'todos',
    Item: {
      id: 'abc',
      text: data.text,
      checked: false,
    },
  };

  await client.put(params).promise();
  return {
    statusCode: 200,
    body: JSON.stringify(data),
  };
};
```

In case we would want to have a custom error message, we could wrap it with a try-catch statement. There is one more thing we need to fix about this code. Storing every item with the same ID will not lead to the expected results.

Let's use the UUID package from npm to generate the new ID on every request. Therefore, we add a minimal `package.json`,

Terminal

```bash
my-app touch package.json
```

package.json

```json
{
  "name": "my-app",
  "private": true
}
```

and run `npm install --save uuid` to install the package.

Terminal

```bash
my-app npm install --save uuid
```

We then can import the module into the `create.js` file and use its uuid function.

```js
const AWS = require('aws-sdk');
const uuid = require('uuid/v4');

const client = new AWS.DynamoDB.documentClient();

module.exports.run = async (event) => {
  const data = JSON.parse(event.body);
  const params = {
    TableName: 'todos',
    Item: {
      id: uuid(),
      text: data.text,
      checked: false,
    },
  };
};
```

Now we've got everything in place and can deploy again. As mentioned in the previous lesson, the serverless framework creates a ZIP. In this case, it will actually include the local node modules as well. Once deployed, we can use curl again, and create the todo, `curl -X POST https://zm7tuyj33a.execute-api.us-east-1.amazonaws.com/dev/todos --data '{ "text": "learn serverless" }`.

We can check in the AWS console if our submission was successful.

If we leave out the data part, the function will fail and return an error, as expected.
