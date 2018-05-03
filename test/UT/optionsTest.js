"use strict";

var assert = require("assert");
var fs = require("fs");
var sinon = require("sinon");
var chrome = require("sinon-chrome");

var createTestPage = require("./../testUtils.js").createTestPage;

describe("options", function () {
    var window;
    var createContextMenuSpy;
    
    function createLi(text, value, selected) {
        return window.$('<li/>')
            .text(text)
            .attr('value', value)
            .addClass(selected ? 'bg-success' : 'bg-info');
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
        
        var selectedPages = window.$("#selectedPages li");
        assert.strictEqual(selectedPages.length, Object.keys(items.selectedPages).length);
        assert.strictEqual(selectedPages[0].innerHTML, "bricklink");
        assert.strictEqual(selectedPages[0].getAttribute("value"), "url1");
        assert.strictEqual(selectedPages[1].innerHTML, "brickset");
        assert.strictEqual(selectedPages[1].getAttribute("value"), "url2");
        
        var notSelectedPages = window.$("#notSelectedPages li");
        assert.strictEqual(notSelectedPages.length, Object.keys(items.notSelectedPages).length);
    });
    
    it("should save options", function() {
        //fill objects with some values
        window.document.getElementById("doubleClick").checked = true;
        window.$("#notSelectedPages").append( createLi( "bricklink", "url1", true ));
        window.$("#notSelectedPages").append( createLi( "brickset", "url2", false ));
        
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
        var selectedPages = window.$("#selectedPages");
        selectedPages.append( createLi("bricklink", "url1", false) );
        selectedPages.append( createLi("brickset", "url2", true) );
        selectedPages.append( createLi("ebay", "url3", true) );
        
        //trigger removing brickset and ebay
        window.document.getElementById("RemovePageFromSelected").dispatchEvent(new window.MouseEvent("click"));
        
        var selectedPagesList = window.$("#selectedPages li");
        var notSelectedPagesList = window.$("#notSelectedPages li");
        assert.strictEqual(selectedPagesList.length, 1);
        assert.strictEqual(notSelectedPagesList.length, 2);
        
        //trigger removing bricklink
        window.$(selectedPagesList[0]).addClass('bg-success');
        window.document.getElementById("RemovePageFromSelected").dispatchEvent(new window.MouseEvent("click"));
        
        //just to check if nothing breaks when no option is selected
        window.document.getElementById("RemovePageFromSelected").dispatchEvent(new window.MouseEvent("click"));
        
        selectedPagesList = window.$("#selectedPages li");
        notSelectedPagesList = window.$("#notSelectedPages li");
        assert.strictEqual(selectedPagesList.length, 0);
        assert.strictEqual(notSelectedPagesList.length, 3);
        assert.strictEqual(notSelectedPagesList[0].innerHTML, "brickset");
        assert.strictEqual(notSelectedPagesList[0].getAttribute("value"), "url2");
        assert.strictEqual(notSelectedPagesList[1].innerHTML, "ebay");
        assert.strictEqual(notSelectedPagesList[1].getAttribute("value"), "url3");
        assert.strictEqual(notSelectedPagesList[2].innerHTML, "bricklink");
        assert.strictEqual(notSelectedPagesList[2].getAttribute("value"), "url1");
    });
    
    it("should add pages from non selected to selected ones", function() {
        //fill objects with some values
        var notSelectedPages = window.$("#notSelectedPages");
        notSelectedPages.append( createLi("bricklink", "url1", true) );
        notSelectedPages.append( createLi("brickset", "url2", false) );
        notSelectedPages.append( createLi("ebay", "url3", true) );
        
        //trigger removing brickset and ebay
        window.document.getElementById("AddPageToSelected").dispatchEvent(new window.MouseEvent("click"));
        
        var selectedPagesList = window.$("#selectedPages li");
        var notSelectedPagesList = window.$("#notSelectedPages li");
        assert.strictEqual(notSelectedPagesList.length, 1);
        assert.strictEqual(selectedPagesList.length, 2);
        
        //trigger removing bricklink
        window.$(notSelectedPagesList[0]).addClass('bg-success');
        window.document.getElementById("AddPageToSelected").dispatchEvent(new window.MouseEvent("click"));
        
        //just to check if nothing breaks when no option is selected
        window.document.getElementById("AddPageToSelected").dispatchEvent(new window.MouseEvent("click"));
        
        selectedPagesList = window.$("#selectedPages li");
        notSelectedPagesList = window.$("#notSelectedPages li");
        assert.strictEqual(notSelectedPagesList.length, 0);
        assert.strictEqual(selectedPagesList.length, 3);
        assert.strictEqual(selectedPagesList[0].innerHTML, "bricklink");
        assert.strictEqual(selectedPagesList[0].getAttribute("value"), "url1");
        assert.strictEqual(selectedPagesList[1].innerHTML, "ebay");
        assert.strictEqual(selectedPagesList[1].getAttribute("value"), "url3");
        assert.strictEqual(selectedPagesList[2].innerHTML, "brickset");
        assert.strictEqual(selectedPagesList[2].getAttribute("value"), "url2");
    });

    it("should show error message when adding page", () => {
        //trigger adding page
        window.$("#addCustomPage").click();
        assert.strictEqual(window.document.getElementById("errorAdd").textContent, "Url is incorrect! Page name cannot be empty! ");

        window.$("#customPageUrl").val("textContent");
        window.$("#addCustomPage").click();
        assert.strictEqual(window.document.getElementById("errorAdd").textContent, "Page name cannot be empty! ");

        window.$("#customPageUrl").val("");
        window.$("#addCustomPageName").val("textContent");
        window.$("#addCustomPage").click();
        assert.strictEqual(window.document.getElementById("errorAdd").textContent, "Url is incorrect! ");
    });

    it("should add page", () => {
        window.$("#customPageUrl").val("urlContent");
        window.$("#addCustomPageName").val("pageName");
        window.$("#addCustomPage").click();
        
        var selectedPagesList = window.$("#selectedPages li");
        assert.strictEqual(window.document.getElementById("errorAdd").textContent, "");
        assert.strictEqual(selectedPagesList.length, 1);
        assert.strictEqual(selectedPagesList[0].innerHTML, "pageName");
        assert.strictEqual(selectedPagesList[0].getAttribute("value"), "urlContent");
    });

    it("should verify page", () => {
        var openPageStub = sinon.stub();
        window.open = openPageStub;

        window.$("#customPageUrl").val("urlContent/_SETNUMBER_");
        window.$("#addCustomPageName").val("pageName");
        window.$("#verifySetNumberText").val("8880");

        //trigger veryfing page
        window.$("#verify").click();
        window.$("#verifySetNumberButton").click();
        
        sinon.assert.calledWithExactly(openPageStub, "urlContent/8880", "_blank");
    });
});

