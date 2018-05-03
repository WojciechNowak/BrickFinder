"use strict";

var sinon = require("sinon");
var chrome = require("sinon-chrome");
var chai = require("chai");

var createTestPage = require("./../testUtils.js").createTestPage;

describe("common", function () {
    var window;
    
    beforeEach(function(done) {
        createTestPage(chrome, ["src/js/common.js"], "<html></html>")
            .then(function (wnd) {
                window = wnd;
                done();
            });
    });
    
    afterEach(function() {
        chrome.reset();
        chrome.flush();
        window.close();
    });

    it("ALL_ID should equal to all", function() {
        chai.expect(window.ALL_ID).to.equal("all");
    });

    it("addContextMenu should call chrome.contextMenus.create", function () {
        window.addContextMenu("brickset", "bricksetUrl");

        sinon.assert.calledOnce(chrome.contextMenus.create);
        sinon.assert.calledWithExactly(chrome.contextMenus.create, {title: "brickset", contexts: ["selection"], id: "bricksetUrl"});
    });
    
    it("createContextMenu should create chrome menu", function () {
        //invoke mock callbacks
        chrome.storage.sync.get.yields({
            selectedPages: {
                bricklink: "bricklinkUrl",
                brickset: "bricksetUrl"
            }
        });
        chrome.contextMenus.removeAll.yields();

        //test trigger
        window.createContextMenu();
        
        sinon.assert.calledOnce(chrome.storage.sync.get);
        sinon.assert.calledWith(chrome.storage.sync.get, "selectedPages");
        sinon.assert.calledOnce(chrome.contextMenus.removeAll);
        sinon.assert.calledThrice(chrome.contextMenus.create);
        sinon.assert.calledWithExactly(chrome.contextMenus.create, {title: "brickset", contexts: ["selection"], id: "bricksetUrl"});
        sinon.assert.calledWithExactly(chrome.contextMenus.create, {title: "bricklink", contexts: ["selection"], id: "bricklinkUrl"});
        sinon.assert.calledWithExactly(chrome.contextMenus.create, {title: "Open all in a new window", contexts: ["selection"], id: "all"});
    });
});