var REPLACE = "REPLA___CE";
var SETNUMBER = "_SETNUMBER_";

function createUrlWithSetNumber(siteUrl, setNumber) {
  var url;
  if (siteUrl.indexOf(REPLACE) !== -1) {
    var regex = new RegExp(REPLACE, "g");
    url = siteUrl.replace(regex, setNumber);
  }
  else if (siteUrl.indexOf(SETNUMBER) !== -1){
    var regex = new RegExp(SETNUMBER, "g");
    url = siteUrl.replace(regex, setNumber);
  }
  else {
    url = siteUrl + setNumber;
  }
  return url;
}

function openAllInNewWindow(setNumber) {
  chrome.storage.sync.get("selectedPages", function (options) {
    var urls = Object.keys(options.selectedPages).reduce(function (urls, page) {
      urls.push(createUrlWithSetNumber(options.selectedPages[page], setNumber));
      return urls;
    }, []).reverse();

    chrome.windows.create({
      url: urls
    });
  });
}

function onMenuClicked(info) {
  var setNumber = info.selectionText.trim();
  if (info.menuItemId === ALL_ID) {
    openAllInNewWindow(setNumber);
  } else {
    var url = createUrlWithSetNumber(info.menuItemId, setNumber);
    window.open(url, "_blank");
  }
}

function convertAndSavePages(pages) {
  var oldToNew = {
    "Brickset": "brickset.com",
    "Bricklink": "bricklink.com",
    "Allegro PL": "allegro.pl",
    "Amazon UK": "amazon.uk",
    "Amazon DE": "amazon.de",
    "Ebay UK": "ebay.uk",
    "Ebay DE": "ebay.de"
  };
  var allPages = Object.assign({}, pages.selectedPages, pages.notSelectedPages);
  var selectedPages = {};

  chrome.storage.sync.get(["selectedPages", "notSelectedPages"], function (items) {
    for (var oldName in items.selectedPages) {
      if (items.selectedPages.hasOwnProperty(oldName)) {
        if (oldToNew.hasOwnProperty(oldName)) {
          var newName = oldToNew[oldName];
          selectedPages[newName] = allPages[newName];
          delete allPages[newName];
        }
      }
    }

    chrome.storage.sync.set({
      selectedPages: selectedPages,
      notSelectedPages: allPages
    }, function () {
      createContextMenu();
    });
  });
}

function handleUpdate(version, pages) {
  if (version < 1.2) {
    convertAndSavePages(pages)
  }
}

chrome.runtime.onMessage.addListener(function (setNumber) {
  openAllInNewWindow(setNumber);
});

chrome.contextMenus.onClicked.addListener(onMenuClicked);

chrome.runtime.onInstalled.addListener(function (details) {
  if (details.reason === "install") {
    var pages = createDefaultPages();

    chrome.storage.sync.set({
      useDoubleClick: true,
      selectedPages: pages.selectedPages,
      notSelectedPages: pages.notSelectedPages
    }, function () {
      createContextMenu();
    });
  } else if (details.reason === "update") {
    var prevVer = parseFloat(details.previousVersion);
    if (!isNaN(prevVer)) {
      var pages = createDefaultPages();
      handleUpdate(prevVer, pages);
    }
  }
});