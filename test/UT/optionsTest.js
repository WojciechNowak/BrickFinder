"use strict";

var assert = require("assert");
var fs = require("fs");
var sinon = require("sinon");
var chrome = require("sinon-chrome");

var createTestPage = require("./../testUtils.js").createTestPage;

describe("options", function () {
    var window;
    var createContextMenuSpy;
    
    function createOption(text, value, selected) {
        var option = window.document.createElement("option");
        option.text = text;
        option.value = value;
        option.selected = selected;
        return option;
    }
    
    beforeEach(function(done) {
        var html = fs.readFileSync("src/html/options.html");
        var scripts = ["src/js/options.js", "src/externals/jquery-2.1.4.min.js"];
        createTestPage(chrome, scripts, html)
            .then(function (wnd) {
                window = wnd;
                createContextMenuSpy = new sinon.spy();
                window.createContextMenu = createContextMenuSpy;
                done();
            });
    });
    
    afterEach(function() {
        createContextMenuSpy.reset();
        chrome.reset();
        chrome.flush();
        window.close();
    });
    
    it("should restore options on document load", function() {
        var items = {
            useDoubleClick: true,
            selectedPages: {bricklink: "url1", brickset: "url2"},
            notSelectedPages: {}
        };
        chrome.storage.sync.get.yields(items);
        // It's a hack, jsdom does not wait until scripts are parsed before firing DOMContentLoaded
        window.document.dispatchEvent(new window.Event("DOMContentLoaded"));

        sinon.assert.calledOnce(chrome.storage.sync.get);
        sinon.assert.calledWith(chrome.storage.sync.get, ["useDoubleClick", "selectedPages", "notSelectedPages"]);

        assert.equal(window.document.getElementById("doubleClick").checked, true);
        
        var selectedPages = window.document.getElementById("selectedPages");
        assert.strictEqual(selectedPages.options.length, Object.keys(items.selectedPages).length);
        assert.strictEqual(selectedPages.options.item(0).text, "bricklink");
        assert.strictEqual(selectedPages.options.item(0).value, "url1");
        assert.strictEqual(selectedPages.options.item(1).text, "brickset");
        assert.strictEqual(selectedPages.options.item(1).value, "url2");
        
        var notSelectedPages = window.document.getElementById("notSelectedPages");
        assert.strictEqual(notSelectedPages.options.length, Object.keys(items.notSelectedPages).length);
    });
    
    it("should save options", function() {
        //fill objects with some values
        window.document.getElementById("doubleClick").checked = true;
        window.document.getElementById("notSelectedPages").add(createOption("bricklink", "url1", true));
        window.document.getElementById("notSelectedPages").add(createOption("brickset", "url2", false));
        
        chrome.storage.sync.set.yields();
        var clock = sinon.useFakeTimers();
        //trigger saving options
        window.document.getElementById("save").dispatchEvent(new window.MouseEvent("click"));
        
        sinon.assert.calledOnce(chrome.storage.sync.set);
        sinon.assert.calledWith(chrome.storage.sync.set, {useDoubleClick: true, selectedPages: {}, notSelectedPages: {bricklink: "url1", brickset: "url2"}});
        sinon.assert.calledOnce(createContextMenuSpy);
        assert.strictEqual(window.document.getElementById("status").textContent, "Options saved.");
        clock.tick(750);
        assert.strictEqual(window.document.getElementById("status").textContent, "");
        clock.restore();
    });
    
    it("should remove pages from selected to non selected ones", function() {
        //fill objects with some values
        var selectedPages = window.document.getElementById("selectedPages");
        selectedPages.add(createOption("bricklink", "url1", false));
        selectedPages.add(createOption("brickset", "url2", true));
        selectedPages.add(createOption("ebay", "url3", true));
        
        //trigger removing brickset and ebay
        window.document.getElementById("RemovePageFromSelected").dispatchEvent(new window.MouseEvent("click"));
        
        var notSelectedPages = window.document.getElementById("notSelectedPages");
        assert.strictEqual(selectedPages.options.length, 1);
        assert.strictEqual(notSelectedPages.options.length, 2);
        
        //trigger removing bricklink
        selectedPages.options.item(0).selected = true;
        window.document.getElementById("RemovePageFromSelected").dispatchEvent(new window.MouseEvent("click"));
        
        //just to check if nothing breaks when no option is selected
        window.document.getElementById("RemovePageFromSelected").dispatchEvent(new window.MouseEvent("click"));
        
        assert.strictEqual(selectedPages.options.length, 0);
        assert.strictEqual(notSelectedPages.options.length, 3);
        assert.strictEqual(notSelectedPages.options.item(0).text, "brickset");
        assert.strictEqual(notSelectedPages.options.item(0).value, "url2");
        assert.strictEqual(notSelectedPages.options.item(1).text, "ebay");
        assert.strictEqual(notSelectedPages.options.item(1).value, "url3");
        assert.strictEqual(notSelectedPages.options.item(2).text, "bricklink");
        assert.strictEqual(notSelectedPages.options.item(2).value, "url1");
    });
    
    it("should add pages from non selected to selected ones", function() {
        //fill objects with some values
        var notSelectedPages = window.document.getElementById("notSelectedPages");
        notSelectedPages.add(createOption("bricklink", "url1", true));
        notSelectedPages.add(createOption("brickset", "url2", false));
        notSelectedPages.add(createOption("ebay", "url3", true));
        
        //trigger removing brickset and ebay
        window.document.getElementById("AddPageToSelected").dispatchEvent(new window.MouseEvent("click"));
        
        var selectedPages = window.document.getElementById("selectedPages");
        assert.strictEqual(notSelectedPages.options.length, 1);
        assert.strictEqual(selectedPages.options.length, 2);
        
        //trigger removing bricklink
        notSelectedPages.options.item(0).selected = true;
        window.document.getElementById("AddPageToSelected").dispatchEvent(new window.MouseEvent("click"));
        
        //just to check if nothing breaks when no option is selected
        window.document.getElementById("AddPageToSelected").dispatchEvent(new window.MouseEvent("click"));
        
        assert.strictEqual(notSelectedPages.options.length, 0);
        assert.strictEqual(selectedPages.options.length, 3);
        assert.strictEqual(selectedPages.options.item(0).text, "bricklink");
        assert.strictEqual(selectedPages.options.item(0).value, "url1");
        assert.strictEqual(selectedPages.options.item(1).text, "ebay");
        assert.strictEqual(selectedPages.options.item(1).value, "url3");
        assert.strictEqual(selectedPages.options.item(2).text, "brickset");
        assert.strictEqual(selectedPages.options.item(2).value, "url2");
    });
});