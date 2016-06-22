"use strict";

var sinon = require("sinon");
var chrome = require("sinon-chrome");

var createTestPage = require("./../testUtils.js").createTestPage;

describe("brickfinder mt", function() {
    var window;
    var setNumber;
    
    function doneCallback(useDoubleClick) {
        return function(errors, wnd, chrome) {
            chrome.storage.sync.get.yields({ useDoubleClick: useDoubleClick });
            wnd.chrome = chrome;
            wnd.console = console;
            wnd.getSelection = function () {
                return setNumber;
            };
            wnd.addEventListener("error", function(event) {
                console.error("script error!!", event.error);
            });
        }
    }
    
    beforeEach(function(done) {      
        var scripts = ["src/js/content.js", "src/js/common.js", "src/js/eventListener.js"];
        createTestPage(chrome, scripts, "<html></html>", doneCallback(true))
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
    
    it("after double click should open a new window", function() {
        setNumber = "8880";
  
        window.document.dispatchEvent(new window.MouseEvent("dblclick"));

        sinon.assert.calledOnce(chrome.runtime.sendMessage);
        sinon.assert.calledWithExactly(chrome.runtime.sendMessage, setNumber);
        
        chrome.storage.sync.get.yields({
            selectedPages: ["url1/", "url2/REPLA___CE"]
        });
        chrome.runtime.onMessage.trigger(setNumber);
        
        sinon.assert.calledOnce(chrome.windows.create);
        sinon.assert.calledWithExactly(chrome.windows.create, {url: ["url2/8880", "url1/8880"]});
    });
});