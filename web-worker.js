
function add(a,b) {
    return a+b;
}
function mul(a,b) {
    return a*b;
}

onmessage = (e) => {
    const data = e.data;
    switch (data.functionName) {
        case 'add':
            postMessage(add(data.args[0], data.args[1]));
            break;

        case 'mul':
            postMessage(mul(data.args[0], data.args[1]));
            break;
    
        default:
            postMessage(`Error: Function ${data.functionName} does not exist`);
            break;
    }
}