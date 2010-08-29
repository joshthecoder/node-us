/**
 * When we get a geocoded result from Yahoo, we
 * will cache it into redis to provide quick access
 * for later queries of the same location.
 */

var sys = require('sys');
var redis = require('redis-client');
var crypto = require('crypto');

var countryCodes = null; // At bottom
var stateCodes = null; // At bottom
var client = redis.createClient();
client.on('connected', function() {
    sys.log('Connected to redis');
});
client.on('reconnecting', function() {
    sys.log('Attempting to re-connect to redis...');
});
client.on('noconnection', function() {
    sys.log('Could not connect to redis!');
});

function hashLocation(location) {
    sys.log("location for tweet: '" + location + "'");
    return crypto.createHash('md5').update(location).digest("hex");
}

var hits = 0, total = 0, growth = 0;
function replaceState(text) {
    // Replace last occurrence of state name.
    for (var i = 0; i < stateCodes.length; i++) {
        var newText = text.replace(new RegExp('^(.*)' + stateCodes[i][1] +'(.*?)$'), '$1' + stateCodes[i][0] + '$2')
        if (newText != text) {
            return nextText;
        }
    }
}

function replaceCountry(text) {
    // Replace last occurrence of state name.
    for (var i = 0; i < stateCodes.length; i++) {
        var newText = text.replace(new RegExp('^(.*)' + countryCodes[i][1] +'(.*?)$'), '$1' + countryCodes[i][0] + '$2')
        if (newText != text) {
            return nextText;
        }
    }
}

function tryGet(query) {
    client.get(query.hash, function(err, value) {
        if (err) { // Error
            sys.log('Redis get failed: ' + err);
            return;
        }

        if (value) { // Cache hit!
            hits++;
            callback(value);
        }

        // We have one more transformation to try.
        if (query.transformations.length > 1) {
            var t = query.transformations.pop();
            query.hash = hashLocation(t(query.original));
            tryGet(query);
        }

        callback(value); // Failure
    });
}

exports.query = function(location, callback) {
    total++; // Only count the total per-location, not per get.

    location = location.replace(/,/g, "").replace(/  /g, " ").toLowerCase();
    tryGet({
        hash: hashLocation(location),
        transformations: [replaceState, replaceCountry],
        original: location
    });
}

exports.store = function(location, coordinates) {
    var hash = hashLocation(location);
    client.set(hash, coordinates[0] + " " + coordinates[1], function(err) {
        if (err) {
            sys.log('Redis set failed: ' + err);
        }
        sys.log("record added: " + coordinates);
        growth++;
    });
}

// Output information about our cache hit rate
setInterval(function() {
    sys.log('Location cache ' + (hits / total) * 100 + "% hits " + growth + " records added");
    hits = total = growth = 0;
}, 30000);

countryCodes = [
    ['ad', 'Andorra'],
    ['ae', 'UAE'],
    ['ae', 'United Arab Emirates'],
    ['af', 'Afghanistan'],
    ['ag', 'Antigua'],
    ['ag', 'Barbuda'],
    ['ai', 'Anguilla'],
    ['al', 'Albania'],
    ['am', 'Armenia'],
    ['an', 'Netherlands Antilles'],
    ['ao', 'Angola'],
    ['aq', 'Antarctica'],
    ['ar', 'Argentina'],
    ['as', 'American Samoa'],
    ['at', 'Austria'],
    ['au', 'Australia'],
    ['aw', 'Aruba'],
    ['az', 'Azerbaidjan'],
    ['ba', 'Bosnia-Herzegovina'],
    ['ba', 'Bosnia'],
    ['bb', 'Barbados'],
    ['bd', 'Bangladesh'],
    ['be', 'Belgium'],
    ['bf', 'Burkina Faso'],
    ['bg', 'Bulgaria'],
    ['bh', 'Bahrain'],
    ['bi', 'Burundi'],
    ['bj', 'Benin'],
    ['bm', 'Bermuda'],
    ['bn', 'Brunei Darussalam'],
    ['bo', 'Bolivia'],
    ['br', 'Brazil'],
    ['bs', 'Bahamas'],
    ['bt', 'Bhutan'],
    ['bv', 'Bouvet Island'],
    ['bw', 'Botswana'],
    ['by', 'Belarus'],
    ['bz', 'Belize'],
    ['ca', 'Canada'],
    ['cf', 'Central African Republic'],
    ['cd', 'Congo'],
    ['cg', 'Congo'],
    ['ch', 'Switzerland'],
    ['ci', 'Ivory Coast'],
    ['ci', 'Cote D\'Ivoire'],
    ['ck', 'Cook Islands'],
    ['cl', 'Chile'],
    ['cm', 'Cameroon'],
    ['cn', 'China'],
    ['co', 'Colombia'],
    ['cr', 'Costa Rica'],
    ['cs', 'Former Czechoslovakia'],
    ['cu', 'Cuba'],
    ['cv', 'Cape Verde'],
    ['cx', 'Christmas Island'],
    ['cy', 'Cyprus'],
    ['cz', 'Czech Republic'],
    ['de', 'Germany'],
    ['dj', 'Djibouti'],
    ['dk', 'Denmark'],
    ['dm', 'Dominica'],
    ['do', 'Dominican Republic'],
    ['dz', 'Algeria'],
    ['ec', 'Ecuador'],
    ['ee', 'Estonia'],
    ['eg', 'Egypt'],
    ['eh', 'Western Sahara'],
    ['er', 'Eritrea'],
    ['es', 'Spain'],
    ['et', 'Ethiopia'],
    ['fi', 'Finland'],
    ['fj', 'Fiji'],
    ['fk', 'Falkland Islands'],
    ['fm', 'Micronesia'],
    ['fo', 'Faroe Islands'],
    ['fr', 'France'],
    ['ga', 'Gabon'],
    ['gb', 'Great Britain'],
    ['gd', 'Grenada'],
    ['ge', 'Georgia'],
    ['gf', 'French Guyana'],
    ['gh', 'Ghana'],
    ['gi', 'Gibraltar'],
    ['gl', 'Greenland'],
    ['gm', 'Gambia'],
    ['gn', 'Guinea'],
    ['gp', 'Guadeloupe'],
    ['gq', 'Equatorial Guinea'],
    ['gr', 'Greece'],
    ['gs', 'South Georgia'],
    ['gs', 'Sandwich Islands'],
    ['gt', 'Guatemala'],
    ['gu', 'Guam (USA)'],
    ['gw', 'Guinea Bissau'],
    ['gy', 'Guyana'],
    ['hk', 'Hong Kong'],
    ['hm', 'Heard and McDonald Islands'],
    ['hn', 'Honduras'],
    ['hr', 'Croatia'],
    ['ht', 'Haiti'],
    ['hu', 'Hungary'],
    ['id', 'Indonesia'],
    ['ie', 'Ireland'],
    ['il', 'Israel'],
    ['in', 'India'],
    ['io', 'British Indian Ocean Territory'],
    ['iq', 'Iraq'],
    ['ir', 'Iran'],
    ['is', 'Iceland'],
    ['it', 'Italy'],
    ['jm', 'Jamaica'],
    ['jo', 'Jordan'],
    ['jp', 'Japan'],
    ['ke', 'Kenya'],
    ['kg', 'Kyrgyzstan'],
    ['kh', 'Cambodia'],
    ['ki', 'Kiribati'],
    ['km', 'Comoros'],
    ['kn', 'Saint Kitts'],
    ['kp', 'North Korea'],
    ['kr', 'South Korea'],
    ['kw', 'Kuwait'],
    ['ky', 'Cayman Islands'],
    ['kz', 'Kazakhstan'],
    ['la', 'Laos'],
    ['lb', 'Lebanon'],
    ['lc', 'Saint Lucia'],
    ['li', 'Liechtenstein'],
    ['lk', 'Sri Lanka'],
    ['lr', 'Liberia'],
    ['ls', 'Lesotho'],
    ['lt', 'Lithuania'],
    ['lu', 'Luxembourg'],
    ['lv', 'Latvia'],
    ['ly', 'Libya'],
    ['ma', 'Morocco'],
    ['mc', 'Monaco'],
    ['md', 'Moldavia'],
    ['mg', 'Madagascar'],
    ['mh', 'Marshall Islands'],
    ['mk', 'Macedonia'],
    ['ml', 'Mali'],
    ['mm', 'Myanmar'],
    ['mn', 'Mongolia'],
    ['mo', 'Macau'],
    ['mp', 'Northern Mariana Islands'],
    ['mq', 'Martinique (French)'],
    ['mr', 'Mauritania'],
    ['ms', 'Montserrat'],
    ['mt', 'Malta'],
    ['mu', 'Mauritius'],
    ['mv', 'Maldives'],
    ['mw', 'Malawi'],
    ['mx', 'Mexico'],
    ['my', 'Malaysia'],
    ['mz', 'Mozambique'],
    ['na', 'Namibia'],
    ['nc', 'New Caledonia'],
    ['ne', 'Niger'],
    ['nf', 'Norfolk Island'],
    ['ng', 'Nigeria'],
    ['ni', 'Nicaragua'],
    ['nl', 'Netherlands'],
    ['no', 'Norway'],
    ['np', 'Nepal'],
    ['nr', 'Nauru'],
    ['nt', 'Neutral Zone'],
    ['nu', 'Niue'],
    ['nz', 'New Zealand'],
    ['om', 'Oman'],
    ['pa', 'Panama'],
    ['pe', 'Peru'],
    ['pf', 'Polynesia'],
    ['pg', 'Papua New Guinea'],
    ['ph', 'Philippines'],
    ['pk', 'Pakistan'],
    ['pl', 'Poland'],
    ['pn', 'Pitcairn Island'],
    ['pr', 'Puerto Rico'],
    ['pt', 'Portugal'],
    ['pw', 'Palau'],
    ['py', 'Paraguay'],
    ['qa', 'Qatar'],
    ['re', 'Reunion'],
    ['ro', 'Romania'],
    ['ru', 'Russia'],
    ['rw', 'Rwanda'],
    ['sa', 'Saudi Arabia'],
    ['sb', 'Solomon Islands'],
    ['sc', 'Seychelles'],
    ['sd', 'Sudan'],
    ['se', 'Sweden'],
    ['sg', 'Singapore'],
    ['sh', 'Saint Helena'],
    ['si', 'Slovenia'],
    ['sj', 'Svalbard'],
    ['sk', 'Slovak Republic'],
    ['sl', 'Sierra Leone'],
    ['sm', 'San Marino'],
    ['sn', 'Senegal'],
    ['so', 'Somalia'],
    ['sr', 'Suriname'],
    ['st', 'Saint Tome'],
    ['st', 'Sao Tome'],
    ['sv', 'El Salvador'],
    ['sy', 'Syria'],
    ['sz', 'Swaziland'],
    ['td', 'Chad'],
    ['tg', 'Togo'],
    ['th', 'Thailand'],
    ['tj', 'Tadjikistan'],
    ['tk', 'Tokelau'],
    ['tm', 'Turkmenistan'],
    ['tn', 'Tunisia'],
    ['to', 'Tonga'],
    ['tp', 'East Timor'],
    ['tr', 'Turkey'],
    ['tt', 'Trinidad'],
    ['tt', 'Tobago'],
    ['tv', 'Tuvalu'],
    ['tw', 'Taiwan'],
    ['tz', 'Tanzania'],
    ['ua', 'Ukraine'],
    ['ug', 'Uganda'],
    ['uk', 'United Kingdom'],
    ['us', 'United States'],
    ['us', 'usa'],
    ['uy', 'Uruguay'],
    ['uz', 'Uzbekistan'],
    ['vc', 'Saint Vincent'],
    ['ve', 'Venezuela'],
    ['vg', 'Virgin Islands'],
    ['vn', 'Vietnam'],
    ['vu', 'Vanuatu'],
    ['ws', 'Samoa'],
    ['ye', 'Yemen'],
    ['yt', 'Mayotte'],
    ['yu', 'Yugoslavia'],
    ['za', 'South Africa'],
    ['zm', 'Zambia'],
    ['zr', 'Zaire'],
    ['zw', 'Zimbabwe'],
];

stateCodes = [
    ['al', 'alabama'],
    ['ak', 'alaska'],
    ['az', 'arizona'],
    ['ar', 'arkansas'],
    ['ca', 'california'],
    ['co', 'colorado'],
    ['ct', 'connecticut'],
    ['de', 'delaware'],
    ['fl', 'florida'],
    ['ga', 'georgia'],
    ['gu', 'guam'],
    ['hi', 'hawaii'],
    ['id', 'idaho'],
    ['il', 'illinois'],
    ['in', 'indiana'],
    ['ia', 'iowa'],
    ['ks', 'kansas'],
    ['ky', 'kentucky'],
    ['la', 'louisiana'],
    ['me', 'maine'],
    ['md', 'maryland'],
    ['ma', 'massachusetts'],
    ['mi', 'michigan'],
    ['mn', 'minnesota'],
    ['ms', 'mississippi'],
    ['mo', 'missouri'],
    ['mt', 'montana'],
    ['ne', 'nebraska'],
    ['nv', 'nevada'],
    ['nh', 'new hampshire'],
    ['nj', 'new jersey'],
    ['nm', 'new mexico'],
    ['ny', 'new york'],
    ['nc', 'north carolina'],
    ['nd', 'north dakota'],
    ['oh', 'ohio'],
    ['ok', 'oklahoma'],
    ['or', 'oregon'],
    ['pw', 'palau'],
    ['pa', 'pennsylvania'],
    ['pr', 'puerto rico'],
    ['ri', 'rhode island'],
    ['sc', 'south carolina'],
    ['sd', 'south dakota'],
    ['tn', 'tennessee'],
    ['tx', 'texas'],
    ['ut', 'utah'],
    ['vt', 'vermont'],
    ['va', 'virginia'],
    ['wa', 'washington'],
    ['wv', 'west virginia'],
    ['wi', 'wisconsin'],
    ['wy', 'wyoming'],
];

