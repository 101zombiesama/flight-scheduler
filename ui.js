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
                <td><input disabled value="0,0" id="matrix-${i}-${j}" type="text"></td>
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

// progress bars

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


//Listeners

document.getElementById('maxNumSolutions').addEventListener('input', (e) => {
    maxNumSolutions = e.target.value;
});

document.getElementById('fleetSize').addEventListener('input', (e) => {
    fleetSize = e.target.value;
});

document.getElementById('maintFreq').addEventListener('input', (e) => {
    maintFreq = e.target.value;
});

document.getElementById('maintDuration').addEventListener('input', (e) => {
    maintDuration = e.target.value;
});

document.getElementById('maxNumGen').addEventListener('input', (e) => {
    maxNumGen = e.target.value;
});

document.getElementById('mutationRate').addEventListener('input', (e) => {
    mutationRate = e.target.value;
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

document.getElementById('btn-matrix').addEventListener('click', () => {
    // make the matrix editor visible
    document.getElementsByClassName('matrix')[0].style.visibility = 'visible';
});

document.getElementById('btn-matrixDone').addEventListener('click', () => {
    // set the adjMat
    adjMat = getMatrix(getAirportsArr());
    // make the matrix editor invisible
    document.getElementsByClassName('matrix')[0].style.visibility = 'hidden';
    // make solve button active
    document.getElementById('btn-solve').classList.remove('disabled');
});

document.getElementById('btn-instructions').addEventListener('click', () => {
    document.getElementsByClassName('instructions')[0].style.visibility = 'visible';
});

document.getElementById('btn-instructionsOk').addEventListener('click', () => {
    document.getElementsByClassName('instructions')[0].style.visibility = 'hidden';
});