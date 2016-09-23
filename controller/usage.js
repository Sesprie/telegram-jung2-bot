'use strict';

var mongoose = require('mongoose');
var UsageClass = require('../model/usage');
var UsageCache;
var UsagePersistence;

var Constants = require('../model/constants');
require('moment');
var moment = require('moment-timezone');
var _ = require('lodash');
var log = require('log-to-file-and-console-node');

// TODO: refactoring required
exports.init = function() {
  var connectionStringCache = '127.0.0.1:27017/jung2botCache';
  if (process.env.OPENSHIFT_MONGODB_DB_PASSWORD) {
    connectionStringCache = process.env.OPENSHIFT_MONGODB_DB_USERNAME + ':' +
      process.env.OPENSHIFT_MONGODB_DB_PASSWORD + '@' +
      process.env.OPENSHIFT_MONGODB_DB_HOST + ':' +
      process.env.OPENSHIFT_MONGODB_DB_PORT + '/' +
      process.env.OPENSHIFT_APP_NAME;
  }

  var connectionStringPersistence = '127.0.0.1:27017/jung2bot';
  if (process.env.MONGODB_URL) {
    connectionStringPersistence = process.env.MONGODB_URL;
  }

  var cacheConnection = mongoose.createConnection(connectionStringCache);
  var persistenceConnection = mongoose.createConnection(connectionStringPersistence);
  UsageCache = cacheConnection.model('Usage', UsageClass.getSchema());
  UsagePersistence = persistenceConnection.model('Usage', UsageClass.getSchema());
};

exports.addUsage = function (msg) {
  var usageCache = new UsageCache();
  usageCache.chatId = msg.chat.id || '';
  usageCache.save();
  var usagePersistence = new UsagePersistence();
  usagePersistence.chatId = msg.chat.id || '';
  usagePersistence.save();
};

var updateUsageNotice = function (chatId) {
  var promise = new mongoose.Promise();
  UsageCache.findOneAndUpdate(
    {chatId: chatId},
    {notified: true},
    {sort: '-dateCreated'},
    function callback(err, foundUsage) {
      promise.complete(foundUsage);
    }
  );
  return promise;
};

exports.isAllowCommand = function (msg, force) {
  var promise = new mongoose.Promise();
  if (force) {
    return promise.complete();
  }
  var chatId = msg.chat.id.toString();
  UsageCache.find({chatId: chatId.toString()})
    .sort('-dateCreated')
    .limit(1)
    .exec(function (err, usages) {
      if (_.isArray(usages) && !_.isEmpty(usages)) {
        var usage = usages[0];
        var diff = Math.abs(moment(usage.dateCreated).diff(moment(), 'minute', true));
        if (diff < Constants.CONFIG.COMMAND_COOLDOWN_TIME) {
          if (usage.notified) {
            promise.reject(usage);
          } else {
            updateUsageNotice(chatId).then(function () {
              promise.reject(usage);
            });
          }
        } else {
          promise.complete();
        }
      } else {
        promise.complete();
      }
    });
  return promise;
};
