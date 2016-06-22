var REPLACE = "REPLA___CE";
var ALL_PAGES = {
  DEFAULT_SELECTED_PAGES: {
      "Brickset": "http://brickset.com/sets/",
      "Bricklink": "http://alpha.bricklink.com/pages/clone/catalogitem.page?S="
    },
  DEFAULT_NOT_SELECTED_PAGES: {
      "Allegro PL": "http://allegro.pl/listing/listing.php?order=d&string=lego+",
      "Amazon UK": "http://www.amazon.co.uk/s/ref=nb_sb_noss_2?url=search-alias%3Daps&field-keywords=lego+",
      "Amazon DE": "http://www.amazon.de/s/ref=nb_sb_noss_2?url=search-alias%3Daps&field-keywords=lego+",
      "Ebay UK": "http://www.ebay.co.uk/sch/i.html?_from=R40&_trksid=p2050601.m570.l1313.TR0.TRC0.H0.Xlego+REPLA___CE.TRS0&_nkw=lego+REPLA___CE&_sacat=0",
      "Ebay DE": "http://www.ebay.de/sch/i.html?_from=R40&_trksid=p2050601.m570.l1313.TR0.TRC0.H0.Xlego+REPLA___CE.TRS0&_nkw=lego+REPLA___CE&_sacat=0"
    }
};

function createUrlWithSetNumber(siteUrl, setNumber) {
  var url;
  if (siteUrl.indexOf(REPLACE) !== -1) {
    var regex = new RegExp(REPLACE, "g");
    url = siteUrl.replace(regex, setNumber);
  }
  else {
    url = siteUrl + setNumber;
  }
  return url;
}

function openAllInNewWindow(setNumber) {
  chrome.storage.sync.get("selectedPages", function(options) {
      var urls = Object.keys(options.selectedPages).reduce(function(urls, page) {
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

chrome.runtime.onMessage.addListener(function(setNumber) {
  openAllInNewWindow(setNumber);
});

chrome.contextMenus.onClicked.addListener(onMenuClicked);

chrome.runtime.onInstalled.addListener(function(details) {
  if (details.reason === "install") {
    chrome.storage.sync.set({
      useDoubleClick: true,
      selectedPages: ALL_PAGES.DEFAULT_SELECTED_PAGES,
      notSelectedPages: ALL_PAGES.DEFAULT_NOT_SELECTED_PAGES
    }, function () {
      createContextMenu();
    });
  } else {
    //extension update clears context menu
    createContextMenu();
  }
});