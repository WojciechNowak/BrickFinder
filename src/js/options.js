function getMultiselectOptions(id) {
  var selectedPages = $("#" + id + " li");
  var pages = {};
  selectedPages.each(function (index) {
    var key = $(this).text();
    pages[key] = $(this).attr("value");
  });

  return pages;
}

function createMultiselectOption(selectedPages, notSelectedPages) {
  var selectedOptions = fillMultiselectOption("selectedPages", selectedPages);
  var notSelectedOptions = fillMultiselectOption("notSelectedPages", notSelectedPages);
}

function fillMultiselectOption(id, pages) {
  for (var key in pages) {
    if (pages.hasOwnProperty(key)) {
      $("#" + id).append('<li class="list-group-item bg-info" style="cursor: pointer;" value="' + pages[key] + '">' + key + '</li>');
    }
  }
}

function moveMultiselectOptions(event) {
  var id = $(this).attr("id");
  var selectFrom = id === "AddPageToSelected" ? "#notSelectedPages" : "#selectedPages";
  var moveTo = id === "AddPageToSelected" ? "#selectedPages" : "#notSelectedPages";

  actives = $(selectFrom + ' li.bg-success');
  actives.clone().appendTo($(moveTo));
  actives.remove();
}

function save_options() {
  clearErrorMsg();
  var useDoubleClick = document.getElementById("doubleClick").checked;
  var selectedPages = getMultiselectOptions("selectedPages");
  var notSelectedPages = getMultiselectOptions("notSelectedPages");

  chrome.storage.sync.set({
    useDoubleClick: useDoubleClick,
    selectedPages: selectedPages,
    notSelectedPages: notSelectedPages
  }, function () {
    createContextMenu();
    var status = document.getElementById("status");
    status.textContent = "Options saved.";
    setTimeout(function () {
      status.textContent = "";
    }, 750);
  });
}

function restore_options() {
  $('body').on('click', '.list-group-item', function () {
    $(this).toggleClass('bg-info');
    $(this).toggleClass('bg-success');
  });

  chrome.storage.sync.get(["useDoubleClick", "selectedPages", "notSelectedPages"], function (items) {
    document.getElementById("doubleClick").checked = items.useDoubleClick;
    createMultiselectOption(items.selectedPages, items.notSelectedPages);
  });
}

function verify_custom_page() {
  var url = $("#customPageUrl").val();
  var setNumber = $("#verifySetNumberText").val();
  url = url.replace("_SETNUMBER_", setNumber);
  window.open(url, "_blank");
}

function add_custom_page() {
  var name = $("#addCustomPageName").val();
  var url = $("#customPageUrl").val();
  var errorText = "";

  if (!url) {
    errorText += "Url is incorrect! "
  }
  if (!name) {
    errorText += "Page name cannot be empty! "
  }

  if (errorText) {
    $("#errorAdd").text(errorText);
  } else {
    clearErrorMsg();
    var page = {};
    page[name] = url;
    fillMultiselectOption("selectedPages", page);
  }
}

function clearErrorMsg() {
  if ($("#errorAdd").val()) {
    $("#errorAdd").text("");
  }
}

document.getElementById("AddPageToSelected").addEventListener("click", moveMultiselectOptions)
document.getElementById("RemovePageFromSelected").addEventListener("click", moveMultiselectOptions)
document.getElementById("verifySetNumberButton").addEventListener("click", verify_custom_page);
document.getElementById("addCustomPage").addEventListener("click", add_custom_page);
document.getElementById("save").addEventListener("click", save_options);
document.addEventListener("DOMContentLoaded", restore_options);