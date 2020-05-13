
// running GA!
var airportsArr = ['BOM', 'KLH', 'PNQ', 'IGX', 'NGP'];
var hubs = ['BOM'];
var maintFreq = 48;
var maintDuration = 4;
var fleetSize = 4;
var n = 4;
// var adjMat = [
//     [[0,0], [n,2], [n,1], [n,3], [n,2]],
//     [[n,2], [0,0], [n,1],[n,1], [n,2]],
//     [[n,1], [n,1], [0,0], [n,2], [n,3]],
//     [[n,3], [n,1], [n,2], [0,0], [n,2]],
//     [[n,2], [n,2], [n,3], [n,2], [0,0]]
// ];
var adjMat = [];

var maxNumSolutions = 50;
var maxNumGen = 10;
var mutationRate = 0.05;

var solutions = []

// set matrix table
setMatrixTable(getAirportsArr());

// Global variables
const worker = new Worker('web-worker.js');
var recievedSolutionsArray = [];
var bestSolutionsArray = [];
var globalBestSolution = null;
var isCalculating = false;

// Handling logic and calculations, communicating with worker

document.getElementById('btn-solve').addEventListener('click', () => {
    // get and set all the variables from ui

    airportsArr = getAirportsArr();
    hubs = getHubsArr();
    maintFreq = document.getElementById('maintFreq').value;
    maintDuration = document.getElementById('maintDuration').value;
    fleetSize = document.getElementById('fleetSize').value;
    adjMat = getMatrix(airportsArr);

    maxNumSolutions = document.getElementById('maxNumSolutions').value;
    maxNumGen = document.getElementById('maxNumGen').value;
    mutationRate = document.getElementById('mutationRate').value;

    // scroll to analysis
    var matrixButton = document.getElementById('btn-matrix');
    var topPos = matrixButton.offsetTop;
    document.getElementById('left-panel').scrollTop = topPos - 60;

    if (!isCalculating) {
        solveHandler();
        createTable();
    }

});

// private handlers

function createTable(solutionObj) {
    const table = document.getElementById('schedule');
    var theadtr = '<th></th>'
    for (let i=0; i<fleetSize; i++) {
        theadtr += `<th>AC${i}</th>`
    }
    const tArray = []
    for (let i=0; i<fleetSize; i++) {
        tArray.push(solutionObj.solution[i].length);
    }
    var tbody = '';
    const max_t = _.max(tArray);
    for (let i=0; i<max_t; i++) {
        var tbodytr = '';
        for (let j=-1; j<fleetSize; j++) {
            if (j===-1) {
                tbodytr += `<td>${i}</td>`
            } else {
                var content;
                if (i >= solutionObj.solution[j].length) {
                    content = '-';
                }
                else {
                    if (typeof solutionObj.solution[j][i] === 'object') {
                        content = `${solutionObj.solution[j][i].origin.name}-${solutionObj.solution[j][i].destination.name}`
                    } else {
                        
                        if (solutionObj.solution[j][i] === 'TO') {
                            content = `<div style="color: green">${solutionObj.solution[j][i]}</div>`
                        }
                        if (solutionObj.solution[j][i] === 'IDLE') {
                            content = `<div style="color: blue">${solutionObj.solution[j][i]}</div>`
                        }
                        if (solutionObj.solution[j][i] === 'MAINT') {
                            content = `<div style="color: orange">${solutionObj.solution[j][i]}</div>`
                        }
                    }
                }
                tbodytr += `<td>${content}</td>`
            }
        }

        const tr = `<tr>${tbodytr}</tr>`
        tbody += tr;
    }

    const tableContent = `
                    <thead>
                        <tr>
                            ${theadtr}
                        </tr>
                    </thead>
                    <tbody>
                        ${tbody}                   
                    </tbody>
                `
    table.innerHTML = tableContent;
}

function resetChart(chart) {
    chart.data.labels = [];
    chart.data.datasets[0].data = [];
    chart.data.datasets[0].backgroundColor = chart.data.labels.map(sol => 'rgba(255, 99, 132, 0.2)');
    chart.data.datasets[0].borderColor = chart.data.labels.map(sol => 'rgba(255, 99, 132, 1)');
    chart.update({});
}

function onCalculating() {
    // diable solve button
    document.getElementById('btn-solve').classList.add("disabled");
    document.getElementById('btn-matrix').classList.add("disabled");
    isCalculating = true;
}

function onDoneCalculating() {
    // re-enable the solve button
    document.getElementById('btn-solve').classList.remove("disabled");
    document.getElementById('btn-matrix').classList.remove("disabled");
    isCalculating = false
}

function solveHandler() {
    // emptying intermediateSolutions before getting new solutions
    resetChart(solutionFitnessChart);
    resetChart(intermediateSolutionFitnessChart);

    // emptying the data in chart
    solutionFitnessChart.data.labels = [];
    solutionFitnessChart.data.datasets[0].data = [];

    worker.onmessage = (e) => {

        const data = e.data
        switch (data.name) {
            case 'onStart':
                onCalculating();
                break;

            case 'onDone':
                onDoneCalculating();
                break;

            case 'onIntermediateSolutions':

                // setting progress bar
                intermediateBar.animate((data.value.id + 1)/maxNumSolutions);

                // update chart
                intermediateSolutionFitnessChart.data.labels.push(data.value.id);
                intermediateSolutionFitnessChart.data.datasets[0].data.push(data.value.fitness);
                intermediateSolutionFitnessChart.data.datasets[0].backgroundColor = intermediateSolutionFitnessChart.data.labels.map(sol => 'rgba(255, 99, 132, 0.2)');
                intermediateSolutionFitnessChart.data.datasets[0].borderColor = 'grey'
                intermediateSolutionFitnessChart.update({});

                // updating table
                createTable(data.value);

                break;

            case 'numFlights':
                // UPDATE UI WITH DATA
                document.getElementById('h6-numFlights').innerHTML = `num Flights: ${data.value}`

                break;

            case 'onGenCreated':
                // setting progress bar
                solutionBar.animate((data.value.genId + 1)/maxNumGen);

                bestSolutionsArray.push(data.value.currentBestSolution);

                // UPDATE UI WITH DATA

                // resetting intermediateSolutionsChart
                // resetChart(intermediateSolutionFitnessChart);
                // update chart
                solutionFitnessChart.data.labels.push(data.value.genId);
                solutionFitnessChart.data.datasets[0].data.push(data.value.fitness);
                solutionFitnessChart.data.datasets[0].backgroundColor = solutionFitnessChart.data.labels.map(sol => 'rgba(255, 99, 132, 0.2)');
                solutionFitnessChart.data.datasets[0].borderColor = solutionFitnessChart.data.labels.map(sol => 'rgba(255, 99, 132, 1)');
                solutionFitnessChart.update({});

                // update table
                createTable(data.value.currentBestSolution);

                document.getElementById('h6-gen').innerHTML = `gen: ${data.value.genId}`

                break;

            case 'onSolutionCreated':
                // update table with the global best solution
                createTable(data.value);
                break;

            default:
                break;
        }

    }
    worker.postMessage({ functionName: 'solve', args: [fleetSize, airportsArr, hubs, adjMat, maintFreq, maintDuration, maxNumSolutions, maxNumGen, mutationRate] })
}

