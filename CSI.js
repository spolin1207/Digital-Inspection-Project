// CSI Stuff
const fs = require('fs');
const util = require('util');

var axios = require('axios');

const AuthToken_LIVE = 'b/XdI6IQzCviZOGJ0E+002DoKUFOPmVDkwpQDbQjm3w/qkdxDUzmqvSYEZDCmJGWpA23OTlhFpxRHFz3WOsvay8V58XdIp/UIsr5TpCdMwtW3QXF2ahwQYp2O6GzKlJcAcadZCT4TVLH02FnaB+FpRdl4E4oO3zW4a9V66i2UR7nMP1N/2KYF8Y1gpmM+mVeKGig7xrARi5Jbe3oIYUiQfhkMOlMstVfyuLNlNU5eRaPlIeIxmep7PGKREBhX7whcEYBq5QA4NeYFxjjDpTdsfYI89D8rViwD+b42zd2DLIZ4tw1w7EqyxNvU1AXTW/iSeD86M4NPNtrmxyIO1meng==';
const AuthToken = 'b/XdI6IQzCviZOGJ0E+002DoKUFOPmVDkwpQDbQjm3w/qkdxDUzmqvSYEZDCmJGWpA23OTlhFpxRHFz3WOsvay8V58XdIp/UIsr5TpCdMwtW3QXF2ahwQYp2O6GzKlJcAcadZCT4TVLH02FnaB+FpV6Gf6zTnHRUE1OYeGy1WG+o2FHErLS1HiFlndTgCQGyjgX7V2ShmcQRSJzTXZiXEevMxCmFHAT5mzw6TAOT9u6xBKzPOxnal30SRdjOe+GzqTOgK2BTWfv8lrmZIgWKow4VmJjkiypV41fX9V+R/0KRs6Ver98NILSc26rPtcD914bFtvY8rXcjQg809iaasg==';

const baseURL_LIVE = 'http://sl-utility/IDORequestService/MGRestService.svc';
const baseURL = 'http://sltest-utility/IDORequestService/MGRestService.svc';


var getJob = module.exports.getJob = async function (jobID) {
    var requestURL = baseURL + '/json/:ido/:props/adv';
    var options = {
        filter: "Job = '" + jobID + "'",
        rowcap: 1
    };
    var headers = {
        Authorization: AuthToken
    };

    requestURL = requestURL.replace(':ido', 'SLJobs');
    requestURL = requestURL.replace(':props', 'Job,JobDate,JschCompdate,JschStartDate,JschEndDate,JobDescription,Item,ItemDescription,QtyReleased,QtyComplete,QtyScrapped,OrdNum,OrdLine,RowPointer');
    var queryString = Object.keys(options).map(key => key + '=' + options[key]).join('&');
    requestURL += '?' + queryString;
    requestURL = encodeURI(requestURL);

    var Items = await makeRequest('GET', requestURL, headers);
    var ItemsArr = [];

    Items[1].Items.forEach((itm) => {
        var itmobj = {};
        itm.forEach((kvp) => {
            itmobj[kvp.Name] = kvp.Value;
        })
        ItemsArr.push(itmobj);
    });

    return ItemsArr;

};


function makeRequest(method, url, headers, body) {

    var config = {
        method: method,
        url: url,
        headers: headers,
        data: body
    };

    var resp = axios(config)
        .then(function (response) {
            return ['success', response.data];

        })
        .catch(function (error) {
            return ['error', error];
        });

    return resp;

}