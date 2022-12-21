const {Builder, Browser, By, Key, until} = require('selenium-webdriver');
const cheerio = require('cheerio');
const DBHelper = require('./db-helper');

const MAX_PHONE_NUMBER = 50000;
const detailUrlRegex = /tot\.com\/[\w-\/]*\d+\.htm.*/;
let chunkContacts = [];
let phoneCount = 0;
const addedPhoneDict = {};
const loadedUrlDict = {};
const blacklist = [
    '/my-orders/identity/buyer',
    '/my-orders/identity/seller',
    '/bookmark',
    '/dashboard/balances',
    '/register',
    '/dang-tin',
    '/uu-dai/tat-ca',
    '/forget-password',
    '/kinh-nghiem',
    '/theo-doi',
    'nhatot.com/vay-mua-nha',
    'nhatot.com/goi-vay-mua-nha',
];

// Init database
const dbHelper = new DBHelper();
dbHelper.truncate("contacts", () => {});

/**
 * Handle logic of extract and save phone number
 *
 * @param [url] The detail page URL
 * @param [$root] The root of HTML document
 * @returns {Promise<void>}
 */
async function extractAndSavePhoneNumber(url, $root) {
    const telStr = $root('#call_phone_btn').attr('href')
    const phone = telStr ? telStr.split(':')[1] : null;
    if (phone && !addedPhoneDict[phone]) {
        chunkContacts.push({phone, link: url});
        addedPhoneDict[phone] = true;
        phoneCount++;
        console.log('count by 1', phoneCount);
    }

    if (chunkContacts.length === 100) {
        await new Promise(resolve => {
            dbHelper.bulkCreate("contacts", chunkContacts, (err) => {
                if (err) console.error("Error during saving contacts", err);
                else console.log("Saved!!!");
                resolve();
            });
        })

        // Reset chunk
        chunkContacts = [];
    }
}

/**
 * Get source from the given URL
 * @param url
 * @returns {Promise<null>}
 */
async function getSourceFromUrl(url) {
    let source = null;
    // Init web driver
    let driver = new Builder()
        .forBrowser(Browser.CHROME)
        .usingServer(process.env.SELENIUM_REMOTE_URL || 'http://localhost:4444/wd/hub')
        .build();

    try {
        await driver.get(url);
        await driver.wait(() => {
            return driver.executeScript('return document.readyState').then((state) => {
                if (state === 'complete') {
                    return true
                }
            });
        }, 1000);
        console.log(`crawled: ${url}`);
        source = await driver.getPageSource();
    } catch (err) {
        console.error(`Error during fetching url: ${url}`, err);
    }
    await driver.quit();
    return source;

}

/**
 * Crawl all phone numbers from the given url
 *
 * @param [url] The webpage url
 */
function crawlPhone(url) {
    return new Promise(async (resolve, reject) => {
        // Extract base url
        const matches = url.match(/^https:\/\/[\w.-]*.com/);
        const baseUrl = (matches && matches.length > 0) ? matches[0] : null;

        /**
         * STOP IF:
         *  - Reach the maximum phone number
         *  - Loaded URL
         *  - Invalid URL
         *  - Contain black list keywords
         * */
        if ((phoneCount === MAX_PHONE_NUMBER)
            || loadedUrlDict[url]
            || !baseUrl
            || blacklist.find(item => url.includes(item))) {
            return resolve();
        }

        try {
            const source = await getSourceFromUrl(url);
            loadedUrlDict[url] = true;
            if (source) {
                const $ = cheerio.load(source);
                if (detailUrlRegex.test(url)) {
                    await extractAndSavePhoneNumber(url, $);
                }

                const promises = []
                // Get all links in the page
                $('a').each(function (_) {
                    let link = $(this).attr('href');
                    if (link) {
                        // Rebuild the link if missing hostname
                        link = link.split('#')[0];
                        if (/^\/.*/.test(link)) {
                            link = baseUrl + link
                        }

                        // Filter to reject useless links
                        if ((/^https:\/\/(?!trogiup|press|careers|chat|accounts).*tot.com/).test(link)
                            && !loadedUrlDict[link]
                        ) {
                            promises.push(crawlPhone(link));
                        }
                    }
                });

                console.log('number of links', promises.length);
                await Promise.all(promises)
            }

            resolve();
        } catch (e) {
            reject(e);
        }
    })
}

// Start crawl phone number
crawlPhone('https://www.chotot.com/')
    .then(() => {
        console.log('DONE!!!');
        process.exit(0);
    })
    .catch((err) => {
        console.error(err);
        process.exit(1)
    })
