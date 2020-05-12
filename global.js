// GOLBAL VARIABLES
var isSolutionInvalid = false;

var intermediateSolutionArray = [];

function onSolutionCreated(chart) {
    // update chart
    chart.data.labels = intermediateSolutionArray.map(sol => sol.id);
    chart.data.datasets[0].data = intermediateSolutionArray.map(sol => sol.fitness);
    chart.data.datasets[0].backgroundColor = intermediateSolutionArray.map(sol => 'rgba(255, 99, 132, 0.2)');
    chart.data.datasets[0].borderColor = intermediateSolutionArray.map(sol => 'rgba(255, 99, 132, 1)');
    chart.update({  });
}