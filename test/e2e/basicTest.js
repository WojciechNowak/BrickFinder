"use strict";

var path = require("path");
var assert = require("assert");
var promise = require("bluebird");
var chromedriver = require("chromedriver");
var webdriver = require("selenium-webdriver");
var webdriverChrome = require("selenium-webdriver/chrome");
var getPackedExtension = require("../testUtils.js").getPackedExtension;

describe("brickfinder basic e2e", function() {
    this.timeout(60000);

    var driver;
    var service;
    var chromeOptions;
    var By = webdriver.By;

    function verifyOpenedUrl(windowHandle, expected) {
        return new promise(function(resolve) {
            driver.switchTo().window(windowHandle)
                .then(function() {
                    return promise.all([driver.getCurrentUrl(), driver.getTitle()]);
                })
                .then(function(data) {
                    assert(expected.some(el => data[0].indexOf(el.url) > -1), "Url not expected: " + data[0]);
                    assert(expected.some(el => data[1].indexOf(el.title)> -1), "Title not expected: " + data[1]);
                    resolve();
                });
        });
    }

    function openExtensionsOptionPage() {
        return driver.get("chrome://extensions")
        .then(() => {
            return driver.findElement(By.tagName("extensions-manager"));
        })
        .then(element => {
            return driver.executeScript("return arguments[0].shadowRoot", element);
        })
        .then(element => {
            return element.findElement(By.tagName("extensions-item-list"));
        })
        .then(element => {
            return driver.executeScript("return arguments[0].shadowRoot", element);
        })
        .then(element => {
            return element.findElement(By.tagName("extensions-item"));
        })
        .then(element => {
            return element.getAttribute("id");
        })
        .then(id => {
            return driver.get("chrome-extension://" + id + "/html/options.html");
        });
    }

    function findAndDblClickElement(elementId) {
        return driver.findElement(By.id(elementId))
            .then(function (element) {
                return driver.actions()
                    .mouseMove(element, { x: 0, y: 0 })
                    .doubleClick()
                    .perform();
            });
    }

    function selectPages(selectId, pageNames) {
        return driver.findElement(By.id(selectId))
        .then(function (pages) {
            var xpath = "//li[" + pageNames.map(site => "contains(text(),'" + site + "')").join(" or ") + "]";
            return pages.findElements(By.xpath(xpath));
            })
        .then(function(selectedPages) {
            return promise.all(selectedPages.map(page => page.click()));
        });
    }

    before(function() {
        return getPackedExtension()
            .then(function(extensionBuf) {
                service = new webdriverChrome.ServiceBuilder()
                    .loggingTo("chromedriver.log")
                    .enableVerboseLogging()
                    .build();

                chromeOptions = new webdriverChrome.Options()
                    .addExtensions(extensionBuf);    
            });
    });

    beforeEach(function() {
        driver = new webdriverChrome.Driver(chromeOptions, service);
    });

    afterEach(function() {
        driver.quit();
    });

    it("should open pages after doubleClick", function () {
        var EXPECTED_VALUES = [
            {
                "url": "basicTestPage.html",
                "title": ""
            },
            {
                "url": "https://brickset.com/sets/42009",
                "title": "42009"
            },
            {
                "url": "https://www.bricklink.com/v2/catalog/catalogitem.page?S=42009#T=S&O={%22iconly%22:0}",
                "title": "42009"
            }
        ];

        return driver.get(path.join(__dirname, "basicTestPage.html"))
            .then(function () {
                return findAndDblClickElement("set1");
            })
            .then(function () {
                var condition = new webdriver.until.Condition("for open windows failed", function () {
                    return driver.getAllWindowHandles().then(windowHandles => windowHandles.length === EXPECTED_VALUES.length ? windowHandles : null);
                });

                return driver.wait(condition, 10000);
            })
            .then(function (windows) {
                return promise.all( windows.map(windowHandle => verifyOpenedUrl(windowHandle, EXPECTED_VALUES )));
            })
            .catch(function(err) {
                driver.quit();
                throw err;
            });
    });

    //unfortunately this test tests only disabling double click from options menu.
    //current chrome driver version doesn't support navigating context menu
    it("should open pages from context menu", function () {
        return openExtensionsOptionPage()
            .then(function() {
                return driver.findElement(By.id("doubleClick")).click();
            })
            .then(function() {
                return driver.findElement(By.id("save")).click();
            })
            .then(function () {
                return driver.get(path.join(__dirname, "basicTestPage.html"));
            })
            .then(function () {
                return driver.findElement(By.id("set_with_space"));
            })
            .then(function (element) {
                return driver.actions()
                    .mouseMove(element, { x: 0, y: 0 })
                    .doubleClick()
                    .click(webdriver.Button.RIGHT)
                    .sendKeys([webdriver.Key.ARROW_DOWN, webdriver.Key.ARROW_DOWN, webdriver.Key.ARROW_DOWN, webdriver.Key.ARROW_DOWN, webdriver.Key.ARROW_RIGHT, webdriver.Key.ENTER])
                    .perform();
            })
            .catch(function(err) {
                driver.quit();
                throw err;
            });
    });

    it("should allow changing search pages", function () {
        var EXPECTED_VALUES = [
            {
                "url": "basicTestPage.html",
                "title": ""
            },
            {
                "url": "https://www.ebay.co.uk",
                "title": "lego 668"
            },
            {
                "url": "https://allegro.pl",
                "title": "Lego 668"
            },
            {
                "url": "https://www.amazon.de",
                "title": "lego 668"
            },
            {
                "url": "https://www.ebay.de",
                "title": "lego 668"
            }
        ];
        var PAGES_TO_SELECT = ["ebay.co.uk", "ebay.de", "amazon.de", "allegro.pl"];

        return openExtensionsOptionPage()
            .then(function() {
                return selectPages("selectedPages", ["brickset.com", "bricklink.com"]);
            })
            .then(function() {
                return driver.findElement(By.id("RemovePageFromSelected")).click();
            })
            .then(function() {
                // unselect pages
                return selectPages("notSelectedPages", ["brickset.com", "bricklink.com"]);
            })
            .then(function () {
                return selectPages("notSelectedPages", PAGES_TO_SELECT);
            })
            .then(function (options) {
                return driver.findElement(By.id("AddPageToSelected")).click();
            })
            .then(function() {
                return driver.findElement(By.id("save")).click();
            })
            .then(function () {
                return driver.get(path.join(__dirname, "basicTestPage.html"));
            })
            .then(function () {
                return findAndDblClickElement("set_with_space");
            })
            .then(function () {
                var condition = new webdriver.until.Condition("for open windows failed", function () {
                    return driver.getAllWindowHandles().then(windowHandles => windowHandles.length === EXPECTED_VALUES.length ? windowHandles : null);
                });

                return driver.wait(condition, 15000);
            })
            .then(function (windows) {
                return promise.all( windows.map(windowHandle => verifyOpenedUrl(windowHandle, EXPECTED_VALUES )));
            })
            .catch(function(err) {
                driver.quit();
                throw err;
            });
    });
});