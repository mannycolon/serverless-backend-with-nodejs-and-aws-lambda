/**
 * event is an object and contains all the necessary request data.
 * context is an object as well. It contains a couple of AWS-specific values, like AWS request ID, log group name, and so on.
 * callback is a function and should be invoked with either an error response as the first argument or a valid response as the second argument.
 */
// module.exports.run = (event, context, callback) => {
//   console.log("I'm a debug statement.");
//   callback(null, 'Hello World');
// };

// Instead of using the callback function, we simply can return a Promise as well.
// module.exports.run = (event) => {
//   return Promise.resolve('Hello');
// };

// Since Node 8 already supports async await, you also can declare a function as async and simply return the desired result.
// module.exports.run = async (event) => {
//   return 'Hello again';
// };

// When using the HTTP event, though, the expected response must be an object containing at least a `statusCode` as well as the `body`. In our case, we return a `JSON.stringify()` response.
module.exports.run = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Hello world',
    }),
  };
};
