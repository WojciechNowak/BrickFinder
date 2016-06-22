"use strict";
var fs = require("fs");
var path = require("path");
var jsdom = require("jsdom");
var Promise = require("bluebird");
var NodeRSA = require("node-rsa");
var ChromeExtension = require("crx");

function defaultCreatedCallback(errors, wnd, chrome) {
    wnd.chrome = chrome;
    wnd.console = console;
    wnd.addEventListener("error", function (event) {
        console.error("script error!!", event.error);
    });
}

function createTestPage(chrome, scriptFiles, html, createdCallback) {
    var createdHandler = createdCallback ? createdCallback : defaultCreatedCallback;
    var src = scriptFiles.map(function(script) {
        return fs.readFileSync(script, "utf-8");
    });
    return new Promise(function(resolve, reject) {
        jsdom.env({
            html: html,
            src: src,
            created: function(errors, wnd) {
                createdHandler(errors, wnd, chrome);
            },
            done: function(errors, wnd) {
                if (errors) {
                    reject(errors);
                } else {
                    resolve(wnd);
                }
            }
        });
    });
}

function getPackedExtension() {
    var key = new NodeRSA();
    key.generateKeyPair();
    var crx = new ChromeExtension({
        privateKey: key.exportKey("pkcs8")
    });

    return crx.load(path.join(__dirname, "..", "src"))
        .then(function() {
            return crx.loadContents();
        })
        .then(function(archiveBuffer) {
            return crx.pack(archiveBuffer);
        });
}

module.exports.createTestPage = createTestPage;
module.exports.getPackedExtension = getPackedExtension;