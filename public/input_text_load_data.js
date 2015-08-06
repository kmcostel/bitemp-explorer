/* takes a string containing a multipart/mixed response from MarkLogic and a collection name like addr.json and returns an array of objects representing physical documents.*/
/* global getBarChart */
function parseData(data, collection, numParts) {
  var split = data.split('--ML_BOUNDARY');
  var items = [];
  for (var i=numParts-1; i < split.length - 1; i=i+numParts) {
    var item = {
      category: null,
      content: null,
      contentLength: null,
      contentType: null,
      format: null,
      uri: null,
      collections: null
    };

    var matches = split[i+numParts-1].match(/Content-Type: ([\w\/]+)/);
    if(matches && matches[1]) {
      item.contentType = matches[1];
    }

    var matches2 = split[i+numParts-1].match(/Content-Disposition: ([\w\/]+); filename="([^"]+)"; category=([\w\/]+); format=([\w\/]+)/);
    if(matches2) {
      if(matches2[2]) {
        item.uri = matches2[2];
      }
      if(matches2[3]) {
        item.category = matches2[3];
      }
      if(matches2[4]) {
        item.format = matches2[4];
      }
    }

    var matches3 = split[i+numParts-1].match(/Content-Length: ([\d]+)/);
    if(matches3 && matches3[1]) {
      item.contentLength = matches3[1];
    }

    //Handles XML docs (converts to JSON, organizes timestamps)
    if(item.contentType === 'application/xml') {
      var matches4 = split[i+numParts-1].match(/(<[^]*>)/);
      var itemContent;
      var xml = itemContent = matches4[0];
      var xmlDoc = $.parseXML(xml),
        $xml = $(xmlDoc),
        $sStart = $xml.find("sysStart"),
        $sEnd = $xml.find("sysEnd"),
        $vStart = $xml.find("valStart"),
        $vEnd = $xml.find("valEnd");

      itemContent = {
        xmlString: itemContent,
        valStart: $vStart.text(),
        sysStart: $sStart.text(),
        valEnd: $vEnd.text(),
        sysEnd: $sEnd.text()
      };
      itemContent = JSON.stringify(itemContent);
      item.content = JSON.parse(itemContent);
    }
    //Handles JSON docs
    else {
      var matches4 = split[i+numParts-1].match(/({[^]*})/);
      if(matches4 && matches4[1]) {
        item.content = JSON.parse(matches4[1]);
      }
    }

    if (parseInt(numParts) === 1 && item.content) {
      /* conditional checks that
      1.) numParts param is 1, item's content is not null
      2.) collection param exists and is not null
      and either
        3.) collection specified is not null AND the collection's substring up until the first '.'' is the same string as the item's filename's substring up to the first '.'. Also the collection's substring after the last '.' must be the same string as the item's filename's substring after the last '.'. Thus 'addr.json' has the same substring as 'addr.48324723423.json' since 'addr' === 'addr' and '.json' === '.json'.
      OR
        4.) the collection string equals the item's filename. If a collection and a item's uri are both 'intern' without a dot extension.
      If 1, 2, and 3 are met OR 1, 2, and 4 are met, then push the object item to the array items.*/
      if(collection) {
        if (collection && collection.indexOf('.') !== -1 && item.uri.substring(0, item.uri.indexOf('.')) === collection.substring(0, collection.indexOf('.'))) {
          if(collection.substring(collection.lastIndexOf('.')) === item.uri.substring(item.uri.lastIndexOf('.'))) {
            items.push(item);
          }
        }
        else if(collection === item.uri) {
          items.push(item);
        }
      }
    }

    else if (parseInt(numParts) === 2) {
      var collArr = split[i].match(/({[^$]*})/);
      if(collArr && collArr[1]) {
        item.collections = JSON.parse(collArr[0]);
      }
      items.push(item);
    }
  }
  return items;
}


function loadData(collection) { //Called from top-level code
  var url = '';
  if (collection !== undefined) {
    url += '/' + collection;
  }
  else {
    collection = 'addr.json';
  }


  $.ajax({
    url: '/v1/search?pageLength=1000',
    data: {
      format: 'json',
      collection: collection
    },
    type: 'POST',
    headers: {
      Accept: 'multipart/mixed'
    },
    async: false,
    success: function(data) {
      var arrData = parseData(data, collection, 1);
      console.log(arrData);
      getBarChart({
        data: arrData,
        width: 800,
        height: 600,
        xAxisLabel: 'System',
        yAxisLabel: 'Valid',
        timeRanges: null,
        draggableBars: false,
        containerId: 'bar-chart-large'
      }, null);
      if(arrData.length === 0 && url !== '') {
        window.alert('Attention!\n\nNo data found in document ' + collection);
      }
    },
    error: function(jqXHR, textStatus, errorThrown) {
      // something went wrong. Take a look in jqXHR and find the status code
      if(textStatus === 'error') {
        window.alert('ERROR!\n\nThe error status is ' + jqXHR.status + '. The error thrown is ' + errorThrown + '.');
        return false;
      }
    }
  });
}


$('#pick-doc').click(function () {
  var uriCollection = $('input[name = collection]').val();
  if(uriCollection === '') {
    window.alert('Please enter a uri.');
  }
  else {
    window.history.pushState('', 'Title', '/?collection='+uriCollection);
    loadData(uriCollection);
  }
});

