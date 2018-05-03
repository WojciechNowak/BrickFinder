//Listen for double clicks. If double clicked text is a valid set number forward it to the extension.
function getSelectedText() {
    return window.getSelection().toString().trim();
}

function addDblClickReaction() {
  document.addEventListener("dblclick", function() {
    if (document.activeElement.tagName.toUpperCase() !== "INPUT") {
      var text = getSelectedText();

      if (text && !isNaN(text)) {
        chrome.runtime.sendMessage(text);
      }
    }
  });
}

chrome.storage.sync.get({
  useDoubleClick: true
}, function(item) {
  if (item.useDoubleClick) {
    addDblClickReaction();
  }
});
