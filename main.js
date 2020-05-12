
// running GA!
const airportsArr = ['BOM', 'KLH', 'PNQ', 'IGX', 'NGP'];
const hubs = ['BOM'];
const maintFreq = 48;
const maintDuration = 4;
const fleetSize = 3;
const n = 4;
const adjMat = [
    [[0,0], [n,2], [n,1], [n,3], [n,2]],
    [[n,2], [0,0], [n,1],[n,1], [0,2]],
    [[n,1], [n,1], [0,0], [n,2], [n,3]],
    [[n,3], [n,1], [n,2], [0,0], [0,2]],
    [[n,2], [0,2], [n,3], [0,2], [0,0]]
];

const maxNumSolutions = 50;

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

document.getElementById('btn-solve').addEventListener('click', () => {
    createInitialSolutions(fleetSize, adjMat, airportsArr, hubs, maintFreq, maintDuration, maxNumSolutions, {solutionFitnessChart});
    console.log(intermediateSolutionArray);
});


