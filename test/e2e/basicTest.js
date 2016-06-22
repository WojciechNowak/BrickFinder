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

    function verifyOpenedUrl(windowHandle, expectedUrl) {
        return new promise(function(resolve) {
            driver.switchTo().window(windowHandle)
                .then(function() {
                    return driver.getCurrentUrl();
                })
                .then(function(url) {
                    assert(url.indexOf(expectedUrl) > -1, "Expected url: " + expectedUrl + " !== actual url: " + url);
                    resolve();
                });
        });
    }

    function openExtensionsOptionPage() {
        return driver.get("chrome://extensions/")
            .then(function () {
                driver.switchTo().frame("extensions")
            })
            .then(function () {
                return driver.findElement(By.className("options-link"));
            })
            .then(function (element) {
                return driver.actions()
                    .mouseMove(element, { x: 0, y: 0 })
                    .click()
                    .perform();
            })
            .then(function () {
                var condition = new webdriver.until.Condition("for options page to load", function () {
                    return driver.getAllWindowHandles().then(windowHandles => windowHandles.length === 2 ? windowHandles : null);
                });

                return driver.wait(condition, 5000);
            })
            .then(function (windowHandles) {
                return driver.switchTo().window(windowHandles[1]);
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

    function selectAllPages(selectId) {
        return driver.findElement(By.id(selectId))
            .then(function (selectedPages) {
                return selectedPages.findElements(By.tagName("option"));
            })
            .then(function (options) {
                var promiseArr = options.reduce(function (memo, option) {
                    memo.push(option.click());
                    return memo;
                }, []);

                return Promise.all(promiseArr);
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
        var EXPECTED_URLS = [
            "basicTestPage.html",
            "http://brickset.com/sets/42009",
            "http://www.bricklink.com/v2/catalog/catalogitem.page?S=42009#T=S&O={}"
        ];

        return driver.get(path.join(__dirname, "basicTestPage.html"))
            .then(function () {
                return findAndDblClickElement("set1");
            })
            .then(function () {
                var condition = new webdriver.until.Condition("for open windows failed", function () {
                    return driver.getAllWindowHandles().then(windowHandles => windowHandles.length === EXPECTED_URLS.length ? windowHandles : null);
                });

                return driver.wait(condition, 10000);
            })
            .then(function (windows) {
                return promise.all(
                    windows.reduce(function(memo, windowHandle, index) {
                        memo.push(verifyOpenedUrl(windowHandle, EXPECTED_URLS[index]));
                        return memo;
                    }, [])
                );
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
        var EXPECTED_URLS = [
            "chrome://chrome/extensions/",
            "basicTestPage.html",
            "http://www.ebay.co.uk/sch/i.html?_from=R40&_trksid=p2050601.m570.l1313.TR0.TRC0.H0.Xlego+668.TRS0&_nkw=lego+668&_sacat=0",
            "http://allegro.pl/listing/listing.php?order=d&string=lego+668",
            "https://www.amazon.de/s/ref=nb_sb_noss_2?url=search-alias%3Daps&field-keywords=lego+668",
            "https://www.amazon.co.uk/s/ref=nb_sb_noss_2?url=search-alias%3Daps&field-keywords=lego+668",
            "http://www.ebay.de/sch/i.html?_from=R40&_trksid=p2050601.m570.l1313.TR0.TRC0.H0.Xlego+668.TRS0&_nkw=lego+668&_sacat=0"
        ];

        return openExtensionsOptionPage()
            .then(function() {
                return selectAllPages("selectedPages");
            })
            .then(function() {
                return driver.findElement(By.id("RemovePageFromSelected")).click();
            })
            .then(function () {
                return selectAllPages("notSelectedPages");
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
                    return driver.getAllWindowHandles().then(windowHandles => windowHandles.length === EXPECTED_URLS.length ? windowHandles : null);
                });

                return driver.wait(condition, 5000);
            })
            .then(function (windows) {
                return promise.all(
                    windows.reduce(function(memo, windowHandle, index) {
                        memo.push(verifyOpenedUrl(windowHandle, EXPECTED_URLS[index]));
                        return memo;
                    }, [])
                );
            })
            .catch(function(err) {
                driver.quit();
                throw err;
            });
    });
});