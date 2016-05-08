require('./lib/command-processor').run(process.argv, function(err, result) {
  console.log(JSON.stringify(result, null, 2));
});
