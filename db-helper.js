const mysql = require('mysql');

const TABLE_FIELDS_MAPPING = {
    contacts: ['phone', 'link'],
}

/**
 * Get fields except primary key by the given table name
 *
 * @param [tableName] The name of table
 * @returns list of field
 */
function getFieldsByTableName(tableName) {
    const fields = TABLE_FIELDS_MAPPING[tableName];
    if (!fields) {
        throw new Error(`Table ${tableName} does not exist`);
    }
    return fields;
}

/**
 * MYSQL Database helper
 *
 * @param [options] options to connect mysql database
 */
function DBHelper(options) {
    options = options || {};
    this.connector = mysql.createConnection({
        host: options.host || 'localhost',
        user: options.user || 'root',
        password: options.password || 'root',
        database: options.database || 'crawler',
    });

    this.connector.connect(function (err) {
        if (err) throw err;
        console.log('DB connected');
    });
}

/**
 * Insert list of mysql into table
 *
 * @param [tableName] The name of table
 * @param [data] The list of mysql
 * @param [callback] The callback function
 */
DBHelper.prototype.bulkCreate = function (tableName, data, callback) {
    const fields = getFieldsByTableName(tableName);
    if (!data || data.length === 0) {
        return callback(null, []);
    }

    const values = [];
    data.forEach(item => {
        const arr = fields.map(field => `'${item[field]}'`);
        values.push(`(${arr.join(', ')})`);
    })

    const sql = `INSERT INTO ${tableName} (${fields.join(', ')})
                   VALUES ${values.join(', ')}`;

    this.connector.query(sql, callback);
}

/**
 * Truncate the given table
 *
 * @param [tableName] The name of table
 * @param [callback] The callback function
 */
DBHelper.prototype.truncate = function (tableName, callback) {
    this.connector.query(`TRUNCATE TABLE ${tableName};`, callback);
}

module.exports = DBHelper;