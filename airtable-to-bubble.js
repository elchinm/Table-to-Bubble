import {Airtable} from "./table-to-bubble.js"

let aTable = new Airtable("pato4SiVa4ukgnQXg.3def483f310a6ba8225e13669b52c9d30bdc5979f32d544bdad434b4fe4476fa");
//  aTable.addParameter("maxRecords", 2);
aTable.addParameter("view", "no logo");
aTable.setFilterForJson("_.index > 3 && _.index < 8");
   aTable.setSorting("index",false);
 // aTable.addParameter("filterByFormula", "index < 5");
 // console.log(aTable);

  aTable.setURL("Content", "app7lMgRcbiBWll4k");
//   console.log(aTable);
// console.log(aTable.url);

let result = {}
let records = await aTable.getObjectedRecords();
if (records.name === 'Error') result = {Status: "Error", Message: records.message}
else {
  result = aTable.result(records);
}

console.log(result)