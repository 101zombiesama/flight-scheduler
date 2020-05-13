
// running GA!
var airportsArr = ['BOM', 'KLH', 'PNQ', 'IGX', 'NGP'];
var hubs = ['BOM'];
var maintFreq = 48;
var maintDuration = 4;
var fleetSize = 4;
var n = 4;
// var adjMat = [
//     [[0,0], [n,2], [n,1], [n,3], [n,2]],
//     [[n,2], [0,0], [n,1],[n,1], [0,2]],
//     [[n,1], [n,1], [0,0], [n,2], [n,3]],
//     [[n,3], [n,1], [n,2], [0,0], [0,2]],
//     [[n,2], [0,2], [n,3], [0,2], [0,0]]
// ];
var adjMat = [];

var maxNumSolutions = 50;
var maxNumGen = 10;
var mutationRate = 0.05;

var solutions = []
// visualizing using chart.js
var ctx1 = document.getElementById('myChart').getContext('2d');
var solutionFitnessChart = new Chart(ctx1, {
    type: 'bar',
    data: {
        labels: [],
        datasets: [{
            label: 'fitness',
            data: [],
            backgroundColor: [],
            borderColor: [],
            borderWidth: 1
        }]
    },
    options: {
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero: true
                }
            }]
        },
    }
});

var ctx2 = document.getElementById('myChart-intermediateSolutions').getContext('2d');
var intermediateSolutionFitnessChart = new Chart(ctx2, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'fitness',
            data: [],
            backgroundColor: [],
            borderColor: 'grey',
            borderWidth: 1,
            fill: false,
            pointRadius: 0,
        }]
    },
    options: {
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero: true
                }
            }]
        },
    }
});

var intermediateBar = new ProgressBar.Line(document.getElementById('intermediateProgressBar'), {
    strokeWidth: 1,
    // easing: 'easeInOut',
    duration: 1,
    color: '#ee6e73',
    trailColor: '#eee',
    trailWidth: 1,
    svgStyle: {width: '100%', height: '100%', borderRadius: '10px'},
    text: {
      style: {
        // Text color.
        // Default: same as stroke color (options.color)
        color: 'black',
        right: '0',
        top: '30px',
        padding: 0,
        margin: 0,
        transform: null
      },
      autoStyleContainer: false
    },
    from: {color: '#FFEA82'},
    to: {color: '#ED6A5A'},
    step: (state, bar) => {
        bar.setText(Math.round(bar.value() * 100) + ' %');
    }
  });

  var solutionBar = new ProgressBar.Line(document.getElementById('solutionProgressBar'), {
    strokeWidth: 3,
    easing: 'easeInOut',
    duration: 700,
    // color: '#ee6e73',
    color: 'green',
    trailColor: '#eee',
    trailWidth: 1,
    svgStyle: {width: '100%', height: '100%', borderRadius: '10px'},
    text: {
      style: {
        // Text color.
        // Default: same as stroke color (options.color)
        color: 'black',
        right: '0',
        top: '30px',
        padding: 0,
        margin: 0,
        transform: null
      },
      autoStyleContainer: false
    },
    from: {color: '#FFEA82'},
    to: {color: '#ED6A5A'},
    step: (state, bar) => {
        bar.setText(Math.round(bar.value() * 100) + ' %');
    }
  });

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
    // n = 4;
    adjMat = getMatrix(airportsArr);

    maxNumSolutions = document.getElementById('maxNumSolutions').value;
    maxNumGen = document.getElementById('maxNumGen').value;
    mutationRate = document.getElementById('mutationRate').value;

    if (!isCalculating) {
        solveHandler();
        createTable();
    }

});

document.getElementById('btn-matrix').addEventListener('click', () => {
    // make the matrix editor visible
    document.getElementsByClassName('matrix')[0].style.visibility = 'visible';
});

document.getElementById('airports').addEventListener('input', () => {
    console.log("changed!");
    airportsArr = getAirportsArr();
    setMatrixTable(airportsArr);
});

document.getElementById('hubs').addEventListener('input', () => {
    hubs = getHubsArr();
    console.log(hubs);
});

document.getElementById('btn-matrixDone').addEventListener('click', () => {
    // set the adjMat
    adjMat = getMatrix(getAirportsArr());
    // make the matrix editor invisible
    document.getElementsByClassName('matrix')[0].style.visibility = 'hidden';
});

// private handlers

function getAirportsArr() {
    const content = document.getElementById('airports').value;
    const arr = content.split(',');
    return arr;
}

function getHubsArr() {
    const content = document.getElementById('hubs').value;
    const arr = content.split(',');
    return arr;
}

function setMatrixTable(airportsArr) {
    const table = document.getElementById('matrix');
    var theadtr = '<th></th>'
    for (let i=0; i<airportsArr.length; i++) {
        theadtr += `<th>${airportsArr[i]}</th>`
    }

    var tbody = ``;
    for (let i=0; i<airportsArr.length; i++) {
        var tbodytr = `<td>${airportsArr[i]}</td>`
        for (let j=0; j<airportsArr.length; j++) {
            if (i === j) {
                tbodytr += `
                <td><input value="0,0" id="matrix-${i}-${j}" type="text"></td>
            `
            }
            else {
                tbodytr += `
                <td><input value="1,1" id="matrix-${i}-${j}" type="text"></td>
            `
            }
        }

        tbody += `<tr>${tbodytr}</tr>`

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

function getMatrix(airportsArr) {
    const arr = [];
    for (let i=0; i<airportsArr.length; i++) {
        arr.push([]);
    }
    for (let i=0; i<airportsArr.length; i++) {
        for (let j=0; j<airportsArr.length; j++) {
            const content = document.getElementById(`matrix-${i}-${j}`).value;
            const data = content.split(',');
            arr[i][j] = [Number(data[0]), Number(data[1])];
        }
    }
    return arr;
    
}

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
    isCalculating = true;
}

function onDoneCalculating() {
    // re-enable the solve button
    document.getElementById('btn-solve').classList.remove("disabled");
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

