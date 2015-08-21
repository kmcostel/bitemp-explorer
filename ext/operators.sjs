function get (context, params) {
  var collection = params.collection;
  var valPeriod;
  var sysPeriod;

  var valOperator = params.valSelectedOp;
  var sysOperator = params.sysSelectedOp;

  var result = {};

  if(valOperator === 'None' && sysOperator === 'None') {
    result.values = 
      cts.search(
        cts.andQuery([
          cts.notQuery(cts.collectionQuery("lsqt")),   
          cts.collectionQuery(collection)                      
        ])
      );
    result.collection = collection;
  }
  else {
    var valAxis = params.valAxis;
    var sysAxis = params.sysAxis;

    if(sysOperator !== 'None' && valOperator !== 'None') {
      valPeriod = cts.period(params.valStart, params.valEnd);
      sysPeriod = cts.period(params.sysStart, params.sysEnd);
      result = {
      values: 
        cts.search(
          cts.andQuery([
            cts.collectionQuery(collection),
            cts.periodRangeQuery(valAxis, valOperator, valPeriod),
            cts.periodRangeQuery(sysAxis, sysOperator, sysPeriod)]
          )
        )
      }
    }
    else if(sysOperator === 'None') {
      valPeriod = cts.period(params.valStart, params.valEnd);
      result = {
        values: 
        cts.search(
          cts.andQuery([
            cts.collectionQuery(collection),
            cts.periodRangeQuery(valAxis, valOperator, valPeriod)]
          )
        )
      }
    }
    else if(valOperator === 'None') {
      sysPeriod = cts.period(params.sysStart, params.sysEnd);
      result = {
        values:
        cts.search(
          cts.andQuery([
            cts.collectionQuery(collection),
            cts.periodRangeQuery(sysAxis, sysOperator, sysPeriod)]
          )
        )
      }
    }
  }
  result.collection = collection;

  var arrayValues = result.values.toArray();
  var uriArr = [];
  var collections = [];
  for(var i = 0; i<arrayValues.length; i++) {
    uriArr[i] = xdmp.nodeUri(arrayValues[i]);
    collections[i] = xdmp.documentGetCollections(uriArr[i]);
  }
  result.uri = uriArr;
  result.collections = collections;

  return result;
}

exports.GET = get;
