
// running GA!
const airportsArr = ['BOM', 'KLH', 'PNQ', 'IGX'];
const hubs = ['BOM'];
const maintFreq = 48;
const maintDuration = 4;
const fleetSize = 3;
const n = 6;
const adjMat = [
    [[0,0], [n,2], [n,1], [n,3]],
    [[n,2], [0,0], [n,1],[n,1]],
    [[n,1], [n,1], [0,0], [n,2]],
    [[n,3], [n,1], [n,2], [0,0]]
];

const maxNumSolutions = 100;


const solutions = createInitialSolutions(fleetSize, adjMat, airportsArr, hubs, maintFreq, maintDuration, maxNumSolutions);
console.log(solutions);


// visualizing using chart.js
var ctx = document.getElementById('myChart').getContext('2d');
var myChart = new Chart(ctx, {
    type: 'bar',
    data: {
        labels: solutions.map(sol => sol.id),
        datasets: [{
            label: 'fitness',
            data: solutions.map(sol => sol.fitness),
            backgroundColor: solutions.map(sol => 'rgba(255, 99, 132, 0.2)'),
            borderColor: solutions.map(sol => 'rgba(255, 99, 132, 1)'),
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
        }
    }
});

