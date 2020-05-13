// importing scripts
importScripts('loadash.js');


// GOLBAL VARIABLES
var isSolutionInvalid = false;

var intermediateSolutionArray = [];

// MODEL //

// Graph related classes and methods

function randChooseFrom(arr) {
    const index = Math.floor(scale(Math.random(), 0, 1, 0, arr.length-0.1));
    return [index, arr[index]];
}

function createCopyOfObject(obj) {
    const copy = Object.assign({}, obj);
    return copy;
}

function createCopyOfArrOfObjects(arrOfObj) {
    const newArr = [];
    for (let obj of arrOfObj) {
        const copy = createCopyOfObject(obj);
        newArr.push(copy);
    }
    return newArr;
}

// node class
class Airport {
    constructor(name, id, type) {
        this.name = name;
        this.id = id;
        this.type = type;
    }

}

class Flight {
    constructor(id, origin, destination, duration) {
        this.id= id;
        this.origin = origin;
        this.destination = destination;
        this.duration = duration;
    }
}

class Aircraft {
    constructor(name, id) {
        this.name = name;
        this.id = id;
        this.initialLocation = null;
        this.location = [];
        this.schedule = [];
        this.numFlights = 0;
        this.maintStatus = 0;
    }
    // methods
    getNextRandomFlight(flights) {

    }

    isFlightFeasible(fleet, flight, isMaintFlight, maintDuration) {
        // checking the clashing between aircraft schedule. contrain: not more than 1 aircraft can exist at an airport. can be changed to
        // a variable for capacity of airport "cap" and modify the function

        const fleetIdArr = fleet.map((ac) => ac.id);
        const thisAcIndexInFleet = fleetIdArr.indexOf(this.id);

        // checking multiple consequetive indices for maintFLight
        if(isMaintFlight) {
            const checkIndexFrom = this.schedule.length + flight.duration;
            const checkIndexTo = checkIndexFrom + (maintDuration - 1);
            for (let i=0; i < thisAcIndexInFleet; i++) {
                var index = checkIndexFrom;
                while (index <= checkIndexTo) {
                    if (JSON.stringify(fleet[i].location[index]) == JSON.stringify(flight.destination)) {
                        return false
                    }
                    index++;
                }
            }
        }
        else {
            const checkIndex = this.schedule.length + flight.duration;
            for (let i=0; i < thisAcIndexInFleet; i++) {
                if (JSON.stringify(fleet[i].location[checkIndex]) == JSON.stringify(flight.destination)) {
                    return false
                }
            }
        }
        

        return true;
    }

    monitorFreqMaint(maintFreq) {
        const t = this.location.length;
        if (t % maintFreq === 0) {
            this.maintStatus = 0;
        }
    }
    
}

// GENTIC ALGORITHM //

// genetic algorithm code for the model

// private helper functions
function scale(num, in_min, in_max, out_min, out_max) {
    return (num - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

const createFleet = (n) => {
    const fleet = [];
    for (let i=0; i<n; i++) {
        const ac = new Aircraft(`AC${i+1}`, i);
        fleet.push(ac);
    }
    return fleet;
}

const createAirports = (airportsArr, hubs) => {
    const airports = [];
    for (let [i, ap] of airportsArr.entries()) {
        var type = 'NONE';
        if (hubs.indexOf(ap) !== -1) {
            type = 'HUB'
        }
        const airport = new Airport(ap, i, type);
        airports.push(airport);
    }
    return airports;
}

const createFlights = (adjMat, airports) => {
    const airportsCopy = _.cloneDeep(airports);
    const flights = [];
    for (let i=0; i<adjMat.length; i++) {
        for (let j=0; j<adjMat[i].length; j++) {
            if (adjMat[i][j][0] > 0) {

                for (let k = 0; k<adjMat[i][j][0]; k++) {

                    const id = flights.length
                    const origin = airportsCopy.filter(obj => obj.id === i)[0];
                    const destination = airportsCopy.filter(obj => obj.id === j)[0];
                    flights.push(new Flight(id, origin, destination, adjMat[i][j][1]));

                }

            }
        }
    }
    
    return flights;
}

const createPreparedFleet = (n, airports) => {
    const preparedFleet = [];

    // also create new empty fleet first

    
    const usedAirportIds = [];
    // randomly choosing different intial origin for each aircraft in fleet
    for (let i=0; i<n; i++) {

        const ac = new Aircraft(`AC${i+1}`, i);

        var valid = false;
        var validAirport = null;

        while(!valid) {

            const randOrigin = randChooseFrom(airports);
            // check if this randOrigin airport id exist in usedAirportIds. if it does, then not valid.
            if (usedAirportIds.indexOf(randOrigin[1].id) !== -1) {
                continue;
            }
            validAirport = randOrigin[1];
            usedAirportIds.push(randOrigin[1].id);
            valid = true;

        }
        
        ac.initialLocation = validAirport;

        preparedFleet.push(ac);
    }
    return preparedFleet;
}

const getMaintProbability = (ac, freq) => {
    // this can return 3 possible types of results. 1, -1, 0-1 random. -1 = no maintainance required. or ac.maintStatus = 1;
    const t = ac.location.length;
    if (ac.maintStatus === 1) {
        return -1;
    }
    else {
        // return 1 if the next t will be the last t of the freq block. i.e t+1 % freq === 0
        if ((t+1) % freq === 0) {
            return 10;
        }
        // else just return a random value
        return Math.random();
    }
}


const createAircraftSchedule = (ac, flights, fleet, airports, maintFreq, maintDuration) => {
    const numAircraftFlights = Math.ceil((flights.length) / (fleet.length));
    while (ac.numFlights < numAircraftFlights) {
        // console.log('loop1');
        // keep trying to choose flight from the flights array until we find a feasible flight. if no feasible flights available, IDLE
        var flightsCopy = _.cloneDeep(flights);
        var flightscopyForMaint = _.cloneDeep(flights);
        var hubs = airports.filter(ap => ap.type === 'HUB');
        var idle = false;
        var feasibleFlight = null;
        var feasibleMaintFlight = null;
        var isMaintFlight = false;
        var mustMaintFlight = false;

        // choose between main flight vs normal flight
        const maintProb = getMaintProbability(ac, maintFreq);
        if (maintProb === 10) {
            // maintanance is must!!
            // keep trying to choose from hubs array until feasible maintFlight found, else null solution, fitness zero.
            isMaintFlight = true;
            mustMaintFlight = true;

        }
        if(Math.random() < maintProb) {
            isMaintFlight = true;
        }

        // if isMaintFLight
        if (isMaintFlight === true && mustMaintFlight === false) {
            // choose a random flight which leads to hub if possible. if cant get any, then feasibleMaintFLight = null;
            while(true) {
                // console.log('loop2');
                const maintFlight = randChooseFrom(flightscopyForMaint);
                if (maintFlight[0] === -1) break;

                // skipping the loop is flight is not initiating from ac's current location
                if (ac.location.length == 0) {
                    if (JSON.stringify(maintFlight[1].origin) !== JSON.stringify(ac.initialLocation)) {
                        flightscopyForMaint.splice(maintFlight[0], 1);
                        continue;
                    }
                }
                else if (JSON.stringify(maintFlight[1].origin) !== JSON.stringify(ac.location[ac.location.length-1])) {
                    flightscopyForMaint.splice(maintFlight[0], 1);
                    continue;
                }

                // check if the flight destination airport exists in hubs array, else continue
                if ( hubs.map(ap => JSON.stringify(ap)).indexOf(JSON.stringify(maintFlight[1].destination)) === -1 ) {
                    flightscopyForMaint.splice(maintFlight[0], 1);
                    continue;
                }
                // check if flight is feasible
                if (ac.isFlightFeasible(fleet, maintFlight[1], true, maintDuration)) {
                    feasibleMaintFlight = maintFlight[1];
                    ac.maintStatus = 1;
                    break;
                }
                else {
                    flightscopyForMaint.splice(maintFlight[0], 1);
                    
                }

            }

        }

        if (isMaintFlight === true && mustMaintFlight === true) {
            // try to choose a random flight whoch leads to hub, if cant, then invalidSolution = true;

            while(true) {
                // console.log('loop3');
                const maintFlight = randChooseFrom(flightscopyForMaint);
                if (maintFlight[0] === -1) {
                    isSolutionInvalid = true;
                    return;
                }

                // skipping the loop is flight is not initiating from ac's current location
                if (ac.location.length == 0) {
                    if (JSON.stringify(maintFlight[1].origin) !== JSON.stringify(ac.initialLocation)) {
                        flightscopyForMaint.splice(maintFlight[0], 1);
                        continue;
                    }
                }
                else if (JSON.stringify(maintFlight[1].origin) !== JSON.stringify(ac.location[ac.location.length-1])) {
                    flightscopyForMaint.splice(maintFlight[0], 1);
                    continue;
                }

                // check if the flight destination airport exists in hubs array, else continue
                if ( hubs.map(ap => JSON.stringify(ap)).indexOf(JSON.stringify(maintFlight[1].destination)) === -1 ) {
                    flightscopyForMaint.splice(maintFlight[0], 1);
                    continue;
                }
                // check if flight is feasible
                if (ac.isFlightFeasible(fleet, maintFlight[1], true, maintDuration)) {
                    feasibleMaintFlight = maintFlight[1];
                    break;
                }
                else {
                    flightscopyForMaint.splice(maintFlight[0], 1);
                    
                }

            }

        }

        if (feasibleMaintFlight) {
            for (let i=0; i<feasibleMaintFlight.duration; i++) {
                ac.schedule.push(feasibleMaintFlight);
                ac.location.push("AIR");
                // monitor frequent maintenance after every location push. i.e at every time slot elapsed
                ac.monitorFreqMaint(maintFreq);

            }
            for (let m=0; m < maintDuration; m++) {
                ac.schedule.push('MAINT');
                // push the current location to aircraft location array
                ac.location.push(feasibleMaintFlight.destination);
                ac.monitorFreqMaint(maintFreq);
            }

            ac.numFlights += 1;
        }
        else {

            while(true) {
                // console.log('loop4');
                const flight = randChooseFrom(flightsCopy);
                // breaking the loop when flightsCopy is empty
                if (flight[0] === -1) {
                    idle = true;
                    break;
                }
                // skipping the loop is flight is not initiating from ac's current location
                if (ac.location.length == 0) {
                    if (JSON.stringify(flight[1].origin) !== JSON.stringify(ac.initialLocation)) {
                        flightsCopy.splice(flight[0], 1);
                        continue;
                    }
                }
                else if (JSON.stringify(flight[1].origin) !== JSON.stringify(ac.location[ac.location.length-1])) {
                    flightsCopy.splice(flight[0], 1);
                    continue;
                }
    
                if (ac.isFlightFeasible(fleet, flight[1], false, maintDuration)) {
                    feasibleFlight = flight[1];
                    break;
                } else {
                    flightsCopy.splice(flight[0], 1);
                }
    
            }
    
            // if feasible flight exists, add it to schedule, add "TO" after, set ac location, increament numFlights
            if (feasibleFlight != null) {
                for (let i=0; i<feasibleFlight.duration; i++) {
                    ac.schedule.push(feasibleFlight);
                    ac.location.push("AIR");
                    // monitor frequent maintenance after every location push. i.e at every time slot elapsed
                    ac.monitorFreqMaint(maintFreq);
    
                }
                ac.schedule.push('TO');
                // push the current location to aircraft location array
                ac.location.push(feasibleFlight.destination);
                ac.monitorFreqMaint(maintFreq);
                ac.numFlights += 1;
            }
            // if idle, then push 'IDLE' to schedule, dont update current location, dont increament numFLights
            if (idle) {
                ac.schedule.push('IDLE');
                // if idle, then push the last location of aircraft again
                ac.location.push(ac.location[ac.location.length-1]);
                ac.monitorFreqMaint(maintFreq);
            }
        }

    }
}

const calculateFitness = (solution, numFlights) => {
    // get length of all the sub arrays in solution array. max of this will be the max t for solution
    const lengths = [];
    var numIdle = 0;
    for (let i = 0; i < solution.length; i++) {
        lengths.push(solution[i].length);
        numIdle += solution[i].filter(ele => ele === "IDLE").length;
    }
    const max_t = _.max(lengths);

    const cost = max_t + numIdle;
    // calculate normalized fitness
    const fitness = (10000/cost)/numFlights;
    return fitness;
}

const normalizeFitness = (fitness, solutions) => {
    var sum = 0;
    for (let sol of solutions) {
        sum += sol.fitness;
    }
    return fitness/sum;
}


const createInitialSolutions = (n, airports, flights, maintFreq, maintDuration, maxNumSolutions, genHolder) => {
    // solutions is an array for aircraft schedules

    // clear intermediateSOlutionArray before creating a solution population
    
    var i = 0;

    outerLoop:
    while (i<maxNumSolutions) {
        
        // vary the parameters for each solution
        const preparedFleet = createPreparedFleet(n, airports);
        const solution = [];
        
        innerLoop:
        for (let ac of preparedFleet) {
            createAircraftSchedule(ac, flights, preparedFleet, airports, maintFreq, maintDuration);
            // if the solution is invalid, go back a step in loop, and calculate again. reset the invalid flag to false
            if (isSolutionInvalid) {
                console.log("Invalid solution!!");
                isSolutionInvalid = false;
                continue outerLoop;
            }
            else {
                solution.push(ac.schedule);
            }
            
        }

        // calculate fitness for 1 solution
        const fitness = calculateFitness(solution, flights.length);
        const solutionObj = { solution: solution, fitness: fitness, id: i }
        genHolder.push(solutionObj);
        // update viz
        onSolutionCreated();

        i++;
    }
    

}

const mutate = (airports, preparedFleet, r) => {
    const usedAirportIds = preparedFleet.map(ac => ac.initialLocation.id);
    for (let i=0; i<preparedFleet.length; i++) {
        if (Math.random() < r) {
            // choose a random ap such that its id does not exists in usedAirportIds array. i.e randomly choose unassigned ap.
            
            while(true) {
                const ap = randChooseFrom(airports);
                if (usedAirportIds.indexOf(ap[1].id) === -1) {
                    preparedFleet[i].initialLocation = ap[1];
                    usedAirportIds[i] = ap[1].id;
                    break;
                }
            }


        }
    }
}

const pickOne = (prevSolutions) => {
    var index = 0;
    var r = Math.random();

    while(r>0) {
        r = r - normalizeFitness(prevSolutions[index].fitness, prevSolutions);
        index++;
    }
    index--;
    return prevSolutions[index];
    // return randChooseFrom(prevSolutions)[1];
}

const getInitialFleetFromSolution = (solution) => {
    const preparedFleet = [];
    for (let i=0; i<solution.solution.length; i++) {
        const ac = new Aircraft(`AC${i+1}`, i);
        ac.initialLocation = solution.solution[i][0].origin;
        preparedFleet.push(ac);
    }
    return preparedFleet;
}

const createNextGen = (airports, flights, maintFreq, maintDuration, prevGen, genHolder, r, maxNumSolutions) => {

    var i = 0;
    
    outerLoop:
    while (i<maxNumSolutions) {
        
        // pick a solution using pickOne, get that solutions preparedFleet(a variable which determines solution)
        // mutate this preparedFleet and create a new solution.
        const pickedSolution = pickOne(prevGen);
        const preparedFleet = getInitialFleetFromSolution(pickedSolution);
        // console.log("picked solution and its fleet", pickedSolution, preparedFleet)
        mutate(airports, preparedFleet, r);

        const solution = [];
        innerLoop:
        for (let ac of preparedFleet) {

            createAircraftSchedule(ac, flights, preparedFleet, airports, maintFreq, maintDuration);
            // if the solution is invalid, go back a step in loop, and calculate again. reset the invalid flag to false
            if (isSolutionInvalid) {
                console.log("Invalid solution!!");
                isSolutionInvalid = false;
                continue outerLoop;
            }
            else {
                solution.push(ac.schedule);
            }
            
        }

        // calculate fitness for 1 solution
        const fitness = calculateFitness(solution, flights.length);
        const solutionObj = { solution: solution, fitness: fitness, id: i }

        // solutions.push(solutionObj);
        genHolder.push(solutionObj);
        
        // update viz
        // onSolutionCreated();

        i++;
        // send solution number to main.js
        postMessage({ name: 'onIntermediateSolutions', value: solutionObj });
    }

}

const getBestOfgen = (gen) => {
    const fitnessArr = gen.map(sol => sol.fitness);
    const maxFitness = _.max(fitnessArr);
    const index = fitnessArr.indexOf(maxFitness);
    return gen[index];
}

const getGenFitness = (gen) => {
    // returns the max fitness of the gen
    const fitnessArr = gen.map(sol => sol.fitness);
    const maxFitness = _.max(fitnessArr);
    return maxFitness;
}

const onGenCreated = (genId, fitness, currentBestSolution, globalBestSolution) => {
    postMessage({ name: 'onGenCreated', value: { genId: genId, fitness: fitness, currentBestSolution: currentBestSolution, globalBestSolution: globalBestSolution } });
}

const onSolutionCreated = () => {
    postMessage({ name: 'onSolutionCreated', value: globalBest });
}

// final solve function. combines other functions to get a final solution

var prevGen = [];
var currentGen = [];
var currentBest = null;
var globalBest = null;

function solve(n, airportsArr, hubs, adjMat, maintFreq, maintDuration, maxNumSolutions, maxNumGen, r) {
    console.log("solving!!!")
    const airports = createAirports(airportsArr, hubs);
    const flights = createFlights(adjMat, airports);
    postMessage({ name: 'numFlights', value: flights.length });
    // this will populate intersolutions array;
    createInitialSolutions(n, airports, flights, maintFreq, maintDuration, maxNumSolutions, currentGen);
    currentBest = getBestOfgen(currentGen);
    globalBest = currentBest;

    onGenCreated(-1, getGenFitness(currentGen), currentBest);

    prevGen = [...currentGen];
    currentGen = [];

    for (let i=0; i<maxNumGen; i++) {
        createNextGen(airports, flights, maintFreq, maintDuration, prevGen, currentGen, r, maxNumSolutions);

        // do the calculation of bestOne here and send it to main for visualization
        const genFitness = getGenFitness(currentGen);

        currentBest = getBestOfgen(currentGen);
        if (currentBest.fitness > globalBest.fitness) globalBest = currentBest;

        onGenCreated(i, genFitness, currentBest, globalBest);
        prevGen = [...currentGen];
        currentGen = [];

    }

    // after all the generations, currentBest will be the solution, provided that each generation has higher fitness than previous gen
    onSolutionCreated();
    console.log("Done!");

}


// handling main.js messages and executions

onmessage = (e) => {

    const data = e.data;

    switch (data.functionName) {
        case 'createInitialSolutions':
            createInitialSolutions(data.args[0], data.args[1], data.args[2], data.args[3], data.args[4], data.args[5], data.args[6], intermediateSolutionArray);
            break;

        case 'solve':
            postMessage({ name: 'onStart' });
            solve(data.args[0], data.args[1], data.args[2], data.args[3], data.args[4], data.args[5], data.args[6], data.args[7], data.args[8]);
            postMessage({ name: 'onDone' });
        default:
            postMessage(`ERROR: function ${data.functionName} doesnt exists`);
            break;
    }

}