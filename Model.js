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