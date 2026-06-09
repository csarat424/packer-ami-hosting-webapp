let count = localStorage.getItem("count") || 0;

document.getElementById("counter").innerText = count;

function incrementCounter() {
    count++;
    localStorage.setItem("count", count);
    document.getElementById("counter").innerText = count;
}