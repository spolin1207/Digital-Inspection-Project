document.getElementById("sql-add").addEventListener('click', sql_add, true);
document.getElementById("sql-lookup").addEventListener('click', sql_lookup, true);
document.getElementById("sql-delete").addEventListener('click', sql_delete, true);

function addJob() {
    document.getElementById("newJob").style.display = 'unset';
}

function closeJob() {
    document.getElementById("newJob").style.display = 'none';
}

function sql_add() {
    let job_sqldata = document.getElementById("sqldata");
    let job_number = document.getElementById("job_number");
    let job_file_input = document.getElementById("job_file_input");
    let job_files = document.getElementById("job_files");
    let job_data = document.getElementById("job_data");
    let job_inspection = document.getElementById("job_inspection");

    let formData = new FormData();
    formData.append('job_number', job_number.value);
    formData.append('job_files', job_files.value);
    formData.append('job_data',  job_data.value);
    formData.append('job_inspection',  job_inspection.value);
    
    for(var i = 0; i < job_file_input.files.length; i++) {
        formData.append('files', job_file_input.files[i]);
    }

    console.log(formData);

    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/job/add');

    xhr.onreadystatechange = () => {
        console.log(xhr.response);
    };
    xhr.onload = () => {
        console.log(xhr.response);
    };
    xhr.onerror = function () {
        console.log(xhr.responseText);
    };
    xhr.send(formData);

}

function sql_lookup() {
    let job_number = document.getElementById("job_number");

    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/job/lookup/' + job_number.value);

    xhr.onload = () => {
        console.log(xhr.response);
    };
    xhr.onerror = function () {
        console.log(xhr.responseText);
    };
    xhr.send();
}

function sql_delete() {
    let job_number = document.getElementById("job_number");

    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/job/delete/' + job_number.value);

    xhr.onload = () => {
        console.log(xhr.response);
    };
    xhr.onerror = function () {
        console.log(xhr.responseText);
    };
    xhr.send();
}