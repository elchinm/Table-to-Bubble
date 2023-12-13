export class Table {
    parameters = [];
    #apiKey;
    #bubble_prefix = "_api_c2_";
    constructor(apiKey) {
        this.#apiKey = apiKey;
    }

    addParameter(key, value) {
        if (typeof value === 'string') value = encodeURIComponent(value);
        let keyVal = key+'=' + value;
        if (value) this.parameters.push(keyVal);
        this[key] = value;
        
    }

    setFilterForJson(filter) {
        this.filterForJson = filter;
    }

    setURL(path, table_id, base_id) {
        base_id ? base_id += "/" : base_id = "/";
        let parameters = this.parameters;  
        if (this.filterForJson) {
            let index = parameters.findIndex(e => e.includes("maxRecords"));
            if (index >= 0) parameters.splice(index,1)}
        this.url = path + base_id + table_id + "/" + (parameters.length > 0 ? "?" + parameters.join("&") : "");
    }

    async getRecords(authMethod) {
        return await fetch(this.url, {
            method: 'GET',
            headers: {
            'Content-Type': 'application/json;charset=utf-8',
            'Authorization': authMethod + " " +this.#apiKey
            }
        })
        .then(response => { 
            if (!response.ok) {throw new Error('Network error, Status: '+response.status)}; return response.json()})
        .catch (err => {return Error(err.message)})       
    }

    updateValuetoObject(records) {
        const regEx = new RegExp("\\\\|\t|\n|\b|\r|\f", "g");
        for (var a = 0; a < records.length; a++) {
            var keys = Object.keys(records[a].fields);
            for (var i = 0; i < keys.length; i++) {
                var value = records[a].fields[keys[i]];
                if (typeof value === "string") {
                    value = value.trim();
                    var isObject = value[0] === "{" && value[value.length - 1] === "}";
                    if (isObject) {
                        try {
                            value = value.replace(regEx, "");
                            var resutObj = JSON.parse(value);
                            records[a].fields[keys[i]] = resutObj;
                        } catch (err) {
                            return Error(`${err.message} at index ${i}, key: ${keys[i]}, value: ${value}`);
                        }
                    } else 
                        if (this.forceNumTextToNumber) { let num = Number(value); if (num) records[a].fields[keys[i]] = Number(value) }         
                }
            }
        }
        return records;
    }

    doFilterForJson(records, filter) {
        if (filter) {
           var conditions = filter.replaceAll("_.", "records[i].fields.");
           for (var i = 0; i < records.length; i++) {     
            try {
                let cond = eval(conditions);
                if (typeof cond != 'boolean') {
                    throw new Error(`(${filter}) contains a syntax error`)
                } 
                else if (!cond) delete records[i];                                  
            } 
            catch (err) {
                if (err.name === "TypeError") {delete records[i]} else
                return Error("Filter for JSON - "+err.message);
            } 
           }
        } 
        let result = records.filter(Boolean);
        if (this.maxRecords) result.length = Math.min(result.length, this.maxRecords);
        return result;
    }

    static convert(obj, param_prefix) {

        if (typeof obj !== 'object' || (obj && Array.isArray(obj))) return {};
    
        if (typeof param_prefix !== 'string' || !param_prefix || (typeof param_prefix === 'string' && !['_p_', '_api_c2_'].includes(param_prefix))) param_prefix = '_p_';
    
    
        /**
         * @param {Object} obj
         * @param {string} [key_parent]
         * @param {boolean} [is_array]
         * @return {Object}
         */
        const convert = (obj, key_parent, is_array) => {
    
            let result = {};
    
            Object.keys(obj).forEach(key => {
    
                let cell = obj[key], key_new = `${param_prefix}${key}`;
    
                if (key_parent && !is_array) key_new = `${key_parent}.${key}`;
    
    
                if ((!cell && cell !== 0 && cell !== false) || typeof cell === 'undefined') {
    
    
                    result[key_new] = null
    
                } else if (typeof cell !== 'object' && !Array.isArray(cell)) {
    
    
                    result[key_new] = cell
    
                } else if (typeof cell === 'object' && !Array.isArray(cell)) {
    
    
                    result = Object.assign(result, convert(cell, key_new))
    
                } else if (Array.isArray(cell)) {
    
                    if (typeof cell[0] === 'object') {
    
                        result[key_new] = [];
    
                        cell.forEach(value => {
    
                            result[key_new].push(convert(value, key_new, true))
                        })
    
                    } else {
    
                        // It's not an object array, so treat
                        // it as an array of Bubble primitives.
                        //
                        result[key_new] = cell;
                    }
                }
            });
    
    
            return result
        };
    
        return convert(obj)
    }

    async getObjectedRecords() {
        return await this.getRecords()
            .then(response => {
                
                if (response.name === 'Error') {throw new Error(response.message)};
                try {  
                    let records = this.updateValuetoObject(response);
       
                    if (records.name == "Error") throw new Error("Update Value to Object "+records);
                    if (this.filterForJson) {
                        records = this.doFilterForJson(records, this.filterForJson);
                        if (records.name == "Error") { throw new Error(records) } }  
                    
                    return records;
   
                }
                catch (err) {
                    throw new Error(err.message);
                }  
            })
            .catch(err => {
  
                return Error(err.message);
            })
      
    }

    result(records) {
        return { Status: "Success", Message: `${records.length} record(s)`, Records: Table.convert({convert:records}, this.#bubble_prefix)[this.#bubble_prefix+"convert"] };
    }
}

export class Airtable extends Table {
    #path = "https://api.airtable.com/v0/";
    setSorting(field, desc) {
        this.addParameter("sort%5B0%5D%5Bfield%5D", field);
        if (field) this.addParameter("sort%5B0%5D%5Bdirection%5D", (desc ? "desc" : desc === undefined ? "": "asc"));
    }

    setURL(table_id, base_id) {
        super.setURL(this.#path, table_id, base_id);
    }

    async getRecords() {
        return await super.getRecords("Bearer")
        .then(response => { if (response.name === 'Error') {throw new Error("Airtable fetch "+response.message)}; return response.records })
        .catch(err => {return Error(err.message)})  
    }
}

export class Baserow extends Table {
    #path = "https://api.baserow.io/api/database/rows/table";

    constructor (token) {
        super(token);
        this.addParameter("user_field_names", true);
        this.forceNumTextToNumber = true;
    }

    setURL(table_id) {
        super.setURL(this.#path, table_id);        
    }

    static cleanEmpty(arr) {
       
        let array = [];
          arr.forEach(obj => {
            for (var propName in obj) {
              if (obj[propName] === null || obj[propName] === undefined) {
                delete obj[propName];
              }
            }
            let newObj = {}; newObj.id = obj.id; delete obj.id; newObj.fields = obj; array.push(newObj);
        });     
       
          return array;    
    }

    async getRecords() {
        return await super.getRecords("Token")
        .then(response => { if (response.name === 'Error') {throw new Error("Baserow fetch "+response.message)}; return response})
        .then(result => {
  
            if (result.results.length > 0) { result.results = Baserow.cleanEmpty(result.results); return (result.results)};
            })
        .catch(err => {return Error(err.message)})  
    }

    
}