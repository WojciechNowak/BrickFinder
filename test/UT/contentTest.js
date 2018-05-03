"use strict";

var sinon = require("sinon");
var chrome = require("sinon-chrome");

var createTestPage = require("./../testUtils.js").createTestPage;

describe("content", function () {
    var window;
    var setNumber = "";
    
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

    beforeEach(function (done) {
        createTestPage(chrome, ["src/js/content.js"], "<html></html>", doneCallback(true))
            .then(function (wnd) {
                window = wnd;
                done();
            });
    });

    afterEach(function () {
        chrome.reset();
        chrome.flush();
        window.close();
    });
    
    it("should not attach double click listener", function (done) {
        chrome.reset();
        window.close();
        createTestPage(chrome, ["src/js/content.js"], "<html></html>", doneCallback(false))
            .then(function (wnd) {
                setNumber = "123";
                wnd.document.dispatchEvent(new window.MouseEvent("dblclick"));
   
                sinon.assert.calledOnce(chrome.storage.sync.get);
                sinon.assert.calledWith(chrome.storage.sync.get, { useDoubleClick: true });
                sinon.assert.notCalled(chrome.runtime.sendMessage);
                done();
            });
    });

    it("should attach double click listener and send a message after dblClick", function () {
        setNumber = " 1234 ";
        window.document.dispatchEvent(new window.MouseEvent("dblclick"));     

        sinon.assert.calledOnce(chrome.storage.sync.get);
        sinon.assert.calledWith(chrome.storage.sync.get, {useDoubleClick: true});
        sinon.assert.calledOnce(chrome.runtime.sendMessage);
        sinon.assert.calledWith(chrome.runtime.sendMessage, "1234");
    });
    
    it("should not send a message if not a valid set number is selected", function () {
        setNumber = "abecadlo";
        window.document.dispatchEvent(new window.MouseEvent("dblclick"));
        setNumber = "a 1234";
        window.document.dispatchEvent(new window.MouseEvent("dblclick"));
        setNumber = "1z234";
        window.document.dispatchEvent(new window.MouseEvent("dblclick"));
        setNumber = "12 34";
        window.document.dispatchEvent(new window.MouseEvent("dblclick"));
        setNumber = "1234 a";
        window.document.dispatchEvent(new window.MouseEvent("dblclick"));
        setNumber = "";
        window.document.dispatchEvent(new window.MouseEvent("dblclick"));
        setNumber = " ";
        window.document.dispatchEvent(new window.MouseEvent("dblclick"));
        sinon.assert.calledOnce(chrome.storage.sync.get);
        sinon.assert.calledWith(chrome.storage.sync.get, {useDoubleClick: true});
        sinon.assert.notCalled(chrome.runtime.sendMessage);
    });
    
    it("should not send a message if selected text in input element", function () {
        setNumber = " 1234";
        window.document.createElement("INPUT").focus();
        window.document.dispatchEvent(new window.MouseEvent("dblclick"));   

        sinon.assert.calledOnce(chrome.storage.sync.get);
        sinon.assert.calledWith(chrome.storage.sync.get, {useDoubleClick: true});
        sinon.assert.notCalled(chrome.runtime.sendMessage);
    });
});
