"use strict";

var sinon = require("sinon");
var chrome = require("sinon-chrome");

var createTestPage = require("./../testUtils.js").createTestPage;

describe("eventListener", function () {
    var window;

    beforeEach(function(done) {
        createTestPage(chrome, ["src/js/pageCreator.js", "src/js/eventListener.js"], "<html></html>")
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

    it("should attach listeners on installation and startup", function () {
        sinon.assert.calledOnce(chrome.runtime.onMessage.addListener);
        sinon.assert.calledOnce(chrome.contextMenus.onClicked.addListener);
        sinon.assert.calledOnce(chrome.runtime.onInstalled.addListener);
    });

    it("should save default values to storage and create context menu on installation", function () {
        var defaultPages = {
            selectedPages: {
                "brickset.com": "http://brickset.com/sets/",
                "bricklink.com": "http://alpha.bricklink.com/pages/clone/catalogitem.page?S="
            },
            notSelectedPages: {
                "allegro.pl": "url",
                "ebay.com": "url2"
            }
        };

        var createDefaultPages = sinon.stub();
        createDefaultPages.returns(defaultPages)
        window.createDefaultPages = createDefaultPages;

        var createContextMenu = sinon.stub();
        window.createContextMenu = createContextMenu;
        chrome.storage.sync.set.yields(createContextMenu);

        chrome.runtime.onInstalled.trigger({reason: "install"});
        sinon.assert.calledOnce(chrome.storage.sync.set);
        sinon.assert.calledWith(chrome.storage.sync.set, Object.assign({useDoubleClick: true}, defaultPages));
        sinon.assert.calledOnce(createContextMenu);
    });

    it("should ignore extension update event when previous version is NaN", function () {
        chrome.runtime.onInstalled.trigger({reason: "update"});
        
        sinon.assert.notCalled(chrome.storage.sync.set);
    });

    it("should handle 1.0 and 1.1 version update correctly ", function () {
        var defaultPages = {
            selectedPages: {
                "brickset.com": "http://brickset.com/sets/",
                "bricklink.com": "http://alpha.bricklink.com/pages/clone/catalogitem.page?S="
            },
            notSelectedPages: {
                "allegro.pl": "url",
                "ebay.com": "url2"
            }
        };

        var expectedPages = {
            selectedPages: {
                "brickset.com": "http://brickset.com/sets/",
                "allegro.pl": "url"
            },
            notSelectedPages: {
                "bricklink.com": "http://alpha.bricklink.com/pages/clone/catalogitem.page?S=",
                "ebay.com": "url2"
            }
        }
        
        chrome.storage.sync.get.yields({
            selectedPages: {"Brickset": "url", "Allegro PL": "url2"}
        });

        var createContextMenu = sinon.stub();
        window.createContextMenu = createContextMenu;
        chrome.storage.sync.set.yields(createContextMenu);

        var createDefaultPages = sinon.stub();
        createDefaultPages.returns(defaultPages)
        window.createDefaultPages = createDefaultPages;

        chrome.runtime.onInstalled.trigger({reason: "update", previousVersion: "1.1"});
        sinon.assert.calledOnce(createDefaultPages);
        sinon.assert.calledOnce(chrome.storage.sync.set);
        sinon.assert.calledWith(chrome.storage.sync.set, expectedPages);
        sinon.assert.calledOnce(createContextMenu);
    });
    
    it("should open information about a set in a new window", function () {
        chrome.storage.sync.get.yields({
            selectedPages: ["url1/", "url2/REPLA___CE", "url3/_SETNUMBER_"]
        });

        chrome.runtime.onMessage.trigger("42043");
        sinon.assert.calledOnce(chrome.storage.sync.get);
        sinon.assert.calledWith(chrome.storage.sync.get, "selectedPages");
        sinon.assert.calledOnce(chrome.windows.create);
        sinon.assert.calledWithExactly(chrome.windows.create, {
            url: ["url3/42043", "url2/42043", "url1/42043"]
        });
    });
    
    it("should open information about a set in a new tab (menu)", function () {
        var openStub = sinon.stub();
        window.open = openStub;
        window.ALL_ID = "ALL";
        
        var menuObj1 = {
            selectionText: " 8880 ",
            menuItemId: "url1/"
        };
         var menuObj2 = {
            selectionText: "8868",
            menuItemId: "url2/REPLA___CE"
        };
        var menuObj3 = {
            selectionText: "42032",
            menuItemId: "url3/_SETNUMBER_"
        };
        chrome.contextMenus.onClicked.trigger(menuObj1);
        chrome.contextMenus.onClicked.trigger(menuObj2);
        chrome.contextMenus.onClicked.trigger(menuObj3);
        sinon.assert.calledThrice(window.open);
        sinon.assert.calledWithExactly(window.open, "url1/8880", "_blank");
        sinon.assert.calledWithExactly(window.open, "url2/8868", "_blank");
        sinon.assert.calledWithExactly(window.open, "url3/42032", "_blank");
    });
    
    it("should open information about a set in a new window (menu)", function () {
        var openStub = sinon.stub();
        window.open = openStub;
        window.ALL_ID = "ALL";
        
        chrome.storage.sync.get.yields({
            selectedPages: ["url1/", "url2/REPLA___CE"]
        });
        
        var menuObj = {
            selectionText: " 8880 ",
            menuItemId: "ALL"
        };
        chrome.contextMenus.onClicked.trigger(menuObj);
        
        sinon.assert.calledOnce(chrome.storage.sync.get);
        sinon.assert.calledWith(chrome.storage.sync.get, "selectedPages");
        sinon.assert.calledOnce(chrome.windows.create);
        sinon.assert.calledWithExactly(chrome.windows.create, {
            url: ["url2/8880", "url1/8880"]
        });
    });
});
