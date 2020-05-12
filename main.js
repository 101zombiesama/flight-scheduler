
// running GA!
const airportsArr = ['BOM', 'KLH', 'PNQ', 'IGX', 'NGP'];
const hubs = ['BOM'];
const maintFreq = 48;
const maintDuration = 4;
const fleetSize = 3;
const n = 6;
const adjMat = [
    [[0,0], [n,2], [n,1], [n,3], [n,2]],
    [[n,2], [0,0], [n,1],[n,1], [0,2]],
    [[n,1], [n,1], [0,0], [n,2], [n,3]],
    [[n,3], [n,1], [n,2], [0,0], [0,2]],
    [[n,2], [0,2], [n,3], [0,2], [0,0]]
];

const maxNumSolutions = 100;

var solutions = []
// visualizing using chart.js
var ctx = document.getElementById('myChart').getContext('2d');
var solutionFitnessChart = new Chart(ctx, {
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

// Global variables
const worker = new Worker('web-worker.js');
var recievedSolutionsArray = [];


// Handling logic and calculations, communicating with worker

document.getElementById('btn-solve').addEventListener('click', () => {
    solveHandler();
    createTable();
});

// private handlers

function solveHandler() {
    // emptying intermediateSolutions before getting new solutions
    recievedSolutionsArray = [];

    // emptying the data in chart
    solutionFitnessChart.data.labels = [];
    solutionFitnessChart.data.datasets[0].data = [];

    worker.onmessage = (e) => {

        const data = e.data
        switch (data.name) {
            case 'solution':
                
                const solutionFromWorker = data.value;
                recievedSolutionsArray.push(solutionFromWorker);

                // UPDATE UI WITH DATA

                // update charts
                solutionFitnessChart.data.labels.push(recievedSolutionsArray[recievedSolutionsArray.length-1].id);
                solutionFitnessChart.data.datasets[0].data.push(recievedSolutionsArray[recievedSolutionsArray.length-1].fitness);
                solutionFitnessChart.data.datasets[0].backgroundColor = recievedSolutionsArray.map(sol => 'rgba(255, 99, 132, 0.2)');
                solutionFitnessChart.data.datasets[0].borderColor = recievedSolutionsArray.map(sol => 'rgba(255, 99, 132, 1)');
                solutionFitnessChart.update({  });

                // updata info
                document.getElementById('h5-numSolutions').innerHTML = `num Solutions: ${recievedSolutionsArray.length}`

                // update table
                createTable(solutionFromWorker);

                break;

            case 'numFlights':
                // UPDATE UI WITH DATA
                document.getElementById('h5-numFlights').innerHTML = `num Flights: ${data.value}`

                break;

            default:
                break;
        }

    }

    worker.postMessage({ functionName: 'createInitialSolutions', args: [fleetSize, adjMat, airportsArr, hubs, maintFreq, maintDuration, maxNumSolutions] })
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
        console.log(i, solutionObj);
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

