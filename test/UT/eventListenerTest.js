"use strict";

var sinon = require("sinon");
var chrome = require("sinon-chrome");

var createTestPage = require("./../testUtils.js").createTestPage;

describe("eventListener", function () {
    var window;

    beforeEach(function(done) {
        createTestPage(chrome, ["src/js/eventListener.js"], "<html></html>")
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
        var EXPECTED_SET_ARGS = {
            useDoubleClick: true,
            selectedPages: {
                "Brickset": "http://brickset.com/sets/",
                "Bricklink": "http://alpha.bricklink.com/pages/clone/catalogitem.page?S="
            },
            notSelectedPages: {
                "Allegro PL": "http://allegro.pl/listing/listing.php?order=d&string=lego+",
                "Amazon UK": "http://www.amazon.co.uk/s/ref=nb_sb_noss_2?url=search-alias%3Daps&field-keywords=lego+",
                "Amazon DE": "http://www.amazon.de/s/ref=nb_sb_noss_2?url=search-alias%3Daps&field-keywords=lego+",
                "Ebay UK": "http://www.ebay.co.uk/sch/i.html?_from=R40&_trksid=p2050601.m570.l1313.TR0.TRC0.H0.Xlego+REPLA___CE.TRS0&_nkw=lego+REPLA___CE&_sacat=0",
                "Ebay DE": "http://www.ebay.de/sch/i.html?_from=R40&_trksid=p2050601.m570.l1313.TR0.TRC0.H0.Xlego+REPLA___CE.TRS0&_nkw=lego+REPLA___CE&_sacat=0"
            }
        };

        var createContextMenu = sinon.stub();
        window.createContextMenu = createContextMenu;
        chrome.storage.sync.set.yields(createContextMenu);

        chrome.runtime.onInstalled.trigger({reason: "install"});
        sinon.assert.calledOnce(chrome.storage.sync.set);
        sinon.assert.calledWith(chrome.storage.sync.set, EXPECTED_SET_ARGS);
        sinon.assert.calledOnce(createContextMenu);
        sinon.assert.calledWithExactly(createContextMenu);
    });

    it("should create context menu after extension update", function () {
        var createContextMenu = sinon.stub();
        window.createContextMenu = createContextMenu;
        chrome.runtime.onInstalled.trigger({reason: "update"});
        
        sinon.assert.calledOnce(createContextMenu);
        sinon.assert.notCalled(chrome.storage.sync.set);
    });
    
    it("should open information about a set in a new window", function () {
        chrome.storage.sync.get.yields({
            selectedPages: ["url1/", "url2/REPLA___CE"]
        });

        chrome.runtime.onMessage.trigger("42043");
        sinon.assert.calledOnce(chrome.storage.sync.get);
        sinon.assert.calledWith(chrome.storage.sync.get, "selectedPages");
        sinon.assert.calledOnce(chrome.windows.create);
        sinon.assert.calledWithExactly(chrome.windows.create, {
            url: ["url2/42043", "url1/42043"]
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
        chrome.contextMenus.onClicked.trigger(menuObj1);
        chrome.contextMenus.onClicked.trigger(menuObj2);
        sinon.assert.calledTwice(window.open);
        sinon.assert.calledWithExactly(window.open, "url1/8880", "_blank");
        sinon.assert.calledWithExactly(window.open, "url2/8868", "_blank");
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
