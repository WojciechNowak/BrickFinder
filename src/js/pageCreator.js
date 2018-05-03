function createDefaultPages() {
    var defaultPages = {};
    defaultPages.selectedPages = {
        "brickset.com": "http://brickset.com/sets/",
        "bricklink.com": "http://alpha.bricklink.com/pages/clone/catalogitem.page?S="
    };

    defaultPages.notSelectedPages = Object.assign({}, createEbayPages(), createAmazonPages(), createAllegroPages());
    return defaultPages;
}

function createAllegroPages() {
    return {
        "allegro.pl": "http://allegro.pl/listing/listing.php?order=d&string=lego+"
    };
}

function createAmazonPages() {
    var amazonPages = [
        "amazon.ca",
        "amazon.cn",
        "amazon.co.uk",
        "amazon.com.au",
        "amazon.com.br",
        "amazon.de",
        "amazon.es",
        "amazon.fr",
        "amazon.it"
    ];

    var obj = {};
    amazonPages.forEach(function (value) {
        obj[value] = "https://www." + value + "/s/ref=nb_sb_noss_2?url=search-alias%3Daps&field-keywords=lego+";
    });
    return obj;
}

function createEbayPages() {
    var ebaySites = [
        //America
        "ebay.ca",
        "ebay.com",
        //Europe
        "ebay.at",
        "ebay.fr",
        "ebay.de",
        "ebay.ie",
        "ebay.it",
        "ebay.nl",
        "ebay.es",
        "ebay.ch",
        "ebay.co.uk",
        //Asia/Pacific
        "ebay.com.au",
        "ebay.com.hk",
        "ebay.in",
        "ebay.com.my",
        "ebay.ph",
        "ebay.com.sg"
    ];

    var obj = {};
    ebaySites.forEach(function (value) {
        obj[value] = "https://www." + value + "/sch/i.html?_from=R40&_trksid=p2050601.m570.l1313.TR0.TRC0.H0.Xlego+REPLA___CE.TRS0&_nkw=lego+REPLA___CE&_sacat=0";
    });
    return obj;
}