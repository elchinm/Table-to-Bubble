import {Baserow} from "./table-to-bubble.cjs"

let bTable = new Baserow("cpMaS13S00QlpgQhvKqMZpj2hrsj9ydv")  ;
//  table.addParameter("page", 1);
//  table.addParameter("size", 3);
bTable.addParameter("view_id", 381179) ;
bTable.addParameter("maxRecords", 2);
bTable.addParameter("order_by", "index") ; 
//  table.addParameter("filters", '{"filter_type": "AND", "filters": [{"field": "parameters", "type": "empty", "value": "Gazelli"}]}');
bTable.setFilterForJson("_.json.surname === 'Çələbi'");
bTable.setURL("229885");
//  console.log(table);


let result = {}
  let records = await bTable.getObjectedRecords();
  if (records.name === 'Error') result = {Status: "Error", Message: records.message}
  else {
      result = bTable.result(records);
  }

//console.log("Json structure", bTable.JSON))
console.log(result)