function getMultiselectOptions(id) {
  var selectedPages = document.getElementById(id);
  var pages = {};
  for (var i=0; i<selectedPages.length; i++) {
    var key = selectedPages.options[i].text;
    pages[key] = selectedPages.options[i].value;
  }

  return pages;
}

function createMultiselectOption(selectedPages, notSelectedPages) {
  var selectedOptions = fillMultiselectOption("selectedPages", selectedPages);
  $("#selectedPages").replaceWith(selectedOptions);

  var notSelectedOptions = fillMultiselectOption("notSelectedPages", notSelectedPages);
  $("#notSelectedPages").replaceWith(notSelectedOptions);
}

function fillMultiselectOption(id, pages) {
  var select = $("<select></select>", {
    id: id,
    multiple: "multiple"
  });

  for (var key in pages) {
    if (pages.hasOwnProperty(key)) {
      var option = '<option value="' + pages[key] + '">' + key + '</option>';
      select.append(option);
    }
  }

  return select;
}

function moveMultiselectOptions(event) {
  var id = $(event.target).attr("id");
  var selectFrom = id === "AddPageToSelected" ? "#notSelectedPages" : "#selectedPages";
  var moveTo = id === "AddPageToSelected" ? "#selectedPages" : "#notSelectedPages";
 
  var selectedItems = $(selectFrom + " :selected").toArray();
  $(moveTo).append(selectedItems);
  selectedItems.remove;
}

function save_options() {
  var useDoubleClick = document.getElementById("doubleClick").checked;
  var selectedPages = getMultiselectOptions("selectedPages");
  var notSelectedPages = getMultiselectOptions("notSelectedPages");
  
  chrome.storage.sync.set({
    useDoubleClick: useDoubleClick,
    selectedPages: selectedPages,
    notSelectedPages: notSelectedPages
  }, function() {
    createContextMenu();
    var status = document.getElementById("status");
    status.textContent = "Options saved.";
    setTimeout(function() {
      status.textContent = "";
    }, 750);
  });
}

function restore_options() {
  chrome.storage.sync.get(["useDoubleClick", "selectedPages", "notSelectedPages"], function(items) {
    document.getElementById("doubleClick").checked = items.useDoubleClick;
    createMultiselectOption(items.selectedPages, items.notSelectedPages);
  });
}

document.getElementById("AddPageToSelected").addEventListener("click", moveMultiselectOptions)
document.getElementById("RemovePageFromSelected").addEventListener("click", moveMultiselectOptions)
document.getElementById("save").addEventListener("click", save_options);
document.addEventListener("DOMContentLoaded", restore_options);