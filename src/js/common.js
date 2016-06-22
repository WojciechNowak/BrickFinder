var ALL_ID = "all";

function addContextMenu(siteName, siteUrl) {
    chrome.contextMenus.create({
        "title": siteName,
        "contexts": ["selection"],
        "id": siteUrl
    });
}

function createContextMenu() {
    chrome.storage.sync.get("selectedPages", function(options) {
        chrome.contextMenus.removeAll(function() {
            Object.keys(options.selectedPages).reverse().forEach(function(key) {
                addContextMenu(key, options.selectedPages[key]);
            });

            chrome.contextMenus.create({
              "title": "Open all in a new window",
              "contexts": ["selection"],
              "id": ALL_ID
            });
        });
    });
}