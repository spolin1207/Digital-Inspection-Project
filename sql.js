const sql = require('mssql');

var config = {
    user: 'sa',
    password: '',
    server: 'CONFIG-FR', 
    database: 'WebInspect',
    options: {           
        encrypt: false,
        trustedConnection: true,
    }
};



var saveToDB = module.exports.saveToDB = async function (jobNumber, jobDetails, jobFiles, jobInspections) {
    console.log('test');
    let pool = await sql.connect(config);
    let result = await pool.request()
        .input('job', sql.NVarChar, jobNumber)
        .input('job_details', sql.NVarChar, jobDetails)
        .input('files', sql.NVarChar, jobFiles)
        .input('inspections', sql.NVarChar, jobInspections)
        .query(`
            BEGIN TRANSACTION;
    
            UPDATE digital_inspection WITH (UPDLOCK, SERIALIZABLE) SET job = @job, job_details = @job_details, files = @files, inspections = @inspections 
            WHERE job = @job;
            
            IF @@ROWCOUNT = 0
            BEGIN
            INSERT digital_inspection(job, job_details, files, inspections) VALUES(@job, @job_details, @files, @inspections);
            END
            
            COMMIT TRANSACTION;`)
        .catch(err => {
            console.log(err);
        });

    return result;

    /*
    //var request = new sql.Request();
    var sqlCommand = `
        BEGIN TRANSACTION;
 
        UPDATE digital_inspection WITH (UPDLOCK, SERIALIZABLE) SET job = @job, job_details = @job_details, files = @files, inspections = @inspections 
        WHERE job = @job;
         
        IF @@ROWCOUNT = 0
        BEGIN
          INSERT digital_inspection(job, job_details, files, inspections) VALUES(@job, @job_details, @files, @inspections);
        END
         
        COMMIT TRANSACTION;`;
    request.input('job', sql.NVarChar, jobNumber);
    request.input('job_details', sql.NVarChar, jobDetails);
    request.input('files', sql.NVarChar, jobFiles);
    request.input('inspections', sql.NVarChar, jobInspections);
    var sqlresult = await sql.query('SELECT TOP (1000) [job],[job_details],[files],[inspections] FROM [digital_inspection]');
    return sqlresult;
*/
    /*
    await sql.connect(config, function (err) {
        if (err) console.log(err);
        var request = new sql.Request();
        var sqlCommand = `
        BEGIN TRANSACTION;
 
        UPDATE digital_inspection WITH (UPDLOCK, SERIALIZABLE) SET job = @job, job_details = @job_details, files = @files, inspections = @inspections 
        WHERE job = @job;
         
        IF @@ROWCOUNT = 0
        BEGIN
          INSERT digital_inspection(job, job_details, files, inspections) VALUES(@job, @job_details, @files, @inspections);
        END
         
        COMMIT TRANSACTION;`;
        request.input('job', sql.NVarChar, jobNumber);
        request.input('job_details', sql.NVarChar, jobDetails);
        request.input('files', sql.NVarChar, jobFiles);
        request.input('inspections', sql.NVarChar, jobInspections);
        request.query(sqlCommand, function (err, result) {
            if (err) console.log(err)
            return result;
        });
    });
    */
}

var getFromDB = module.exports.getFromDB = async function (JobNum) {
    let pool = await sql.connect(config);
    let result = await pool.request()
        .input('JobNum', sql.VarChar, (typeof JobNum != 'undefined' ? JobNum : ''))
        .query(`SELECT TOP (1000) [job],[job_details],[files],[inspections] FROM [digital_inspection] ${(typeof JobNum != 'undefined' ? 'WHERE [job] = @JobNum' : '')};`);
    return result;

    /*
    await sql.connect(config);
    var sqlresult = await sql.query('SELECT TOP (1000) [job],[job_details],[files],[inspections] FROM [digital_inspection]');
    return sqlresult;
    */
}

var deleteFromDB = module.exports.deleteFromDB = async function () {
    sql.connect(config, function (err) {
        if (err) console.log(err);
        var request = new sql.Request();
        request.query('select * from Student', function (err, recordset) {
            if (err) console.log(err)
            return recordset;
        });
    });
}