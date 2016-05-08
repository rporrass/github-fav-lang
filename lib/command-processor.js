'use strict';
var _ = require('lodash');
var ArgumentParser = require('argparse').ArgumentParser;
var GitHubApi = require('github');
var async = require('async');

var parser = new ArgumentParser({
  version: '0.0.1',
  addHelp:true,
  description: 'Command line application, which allow users to enter an arbitrary ' +
                  'GitHub username, and be presented with a best guess of the ' +
                  'GitHub user\'s favourite programming language.'
});

parser.addArgument(
  ['-u', '--username'],
  {
    help: 'GitHub username'
  }
);

parser.addArgument(
  ['-gprt', '--github-port'],
  {
    help: 'GitHub protocol to use to make the API calls'
  }
);

parser.addArgument(
  ['-gptc', '--github-protocol'],
  {
    help: 'GitHub protocol to use to make the API calls'
  }
);

parser.addArgument(
  ['-gh', '--github-host'],
  {
    help: 'GitHub host to use to make the API calls'
  }
);

parser.addArgument(
  ['-gpp', '--github-path-prefix'],
  {
    help: 'GitHub protocol to use to make the API calls'
  }
);

parser.addArgument(
  ['-gt', '--github-timeout'],
  {
    help: 'GitHub timeout to use to make the API calls'
  }
);

var gitHubDefaults = {
  version: '3.0.0',
};

var parseToGitHubKey = function(key) {
  var result;
  if (key.indexOf('github_') === 0) {
    result = key.replace('github_', '');
    for (var i = result.indexOf('_'); i !== -1; i = result.indexOf('_')) {
      result = result.substring(0, i) + result.substring(i + 1, i + 2).toUpperCase() + result.substring(i + 2);
    }
  }
  return result;
};

var parseGitHubOptions = function(args) {
  var result = {};
  _.each(args, function(value, key) {
    var gitHubKey = parseToGitHubKey(key);
    if (gitHubKey && value !== null) {
      result[gitHubKey] = value;
    }

  });
  return result;
};

var processRepoResponse = function(res) {
  var result = {};
  _.each(res, function(repo) {
    result[repo.language] = (_.has(result, repo.language) ? result[repo.language] : 0) + 1;
  });

  return result;
};

var CommandProcessor = function() {

  this.run = function(commandLineArgs, callback) {
    var args = parser.parseArgs(_.slice(commandLineArgs, 2));

    var settings = _.defaults(gitHubDefaults, parseGitHubOptions(args));
    var username = args.username;
    var github = new GitHubApi(settings);

    async.parallel([
      function(next) {
        github.repos.getFromUser({user: username}, function(err, res) {
          next(err, processRepoResponse(res));
        });
      },
      function(next) {
        github.user.getFollowingFromUser({user: username}, function(err, res) {
          next(err, processRepoResponse(res));
        });
      }
    ],
    function(err, results) {
      var result = {};
      if (err) {
        callback(err);
      }
      else {
        var tmp = {};
        _.each(results, function(res) {
          _.each(res, function(value, key) {
            tmp[key] = (tmp[key] || 0) + value;
          });
        });

        var max = _.max(_.values(tmp));

        _.each(tmp, function(value, key) {
          if (value === max) {
            result[key] = value;
          }
        });
        callback(null, result);
      }
    });
  };
};

module.exports = new CommandProcessor();
