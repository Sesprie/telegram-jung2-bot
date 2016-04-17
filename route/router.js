'use strict';

var log = require('log-to-file-and-console-node');
var MessageController = require('../controller/message');
var _ = require('lodash');

exports.onTopTen = function (msg, bot) {
  log.i('/topten msg: ' + JSON.stringify(msg));
  MessageController.getTopTen(msg).then(function onSuccess(message) {
    if (!_.isEmpty(message)) {
      log.i('/topten sendBot to ' + msg.chat.id + ' message: ' + message);
      bot.sendMessage(msg.chat.id, message);
    } else {
      log.e('/topten: message is empty');
    }
  }, function onFailure(err) {
    log.e('/topten err: ' + err.message);
    bot.sendMessage(msg.chat.id, err.message);
  });
};

exports.onAllJung = function (msg, bot) {
  log.i('/alljung msg: ' + JSON.stringify(msg));
  MessageController.getAllJung(msg).then(function onSuccess(message) {
    if (!_.isEmpty(message)) {
      log.i('/alljung sendBot to ' + msg.chat.id + ' message: ' + message);
      bot.sendMessage(msg.chat.id, message);
    } else {
      log.e('/alljung: message is empty');
    }
  }, function onFailure(err) {
    log.e('/alljung err: ' + err.message);
    bot.sendMessage(msg.chat.id, err.message);
  });
};

exports.onMessage = function (msg) {
  log.i('msg: ' + JSON.stringify(msg));
  if (MessageController.shouldAddMessage(msg)) {
    MessageController.addMessage(msg, function () {
      log.i('add message success');
    });
  } else {
    log.e('skip repeated message');
  }
};