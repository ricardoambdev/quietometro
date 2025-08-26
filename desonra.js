function getStore(){
  return JSON.parse(localStorage.getItem("students") || "{}");
}

function render(){
  const saved = getStore();
  const entries = Object.entries(saved).sort((a,b)=> b[1]-a[1] || a[0].localeCompare(b[0]));
  const rankList = document.getElementById("rankList");
  const winnerBox = document.getElementById("winnerBox");
  const winnerName = document.getElementById("winnerName");
  const winnerCount = document.getElementById("winnerCount");

  rankList.innerHTML = "";

  if(entries.length === 0){
    winnerBox.style.display = "none";
    const li = document.createElement("li");
    li.textContent = "Nenhum registro ainda.";
    rankList.appendChild(li);
    return;
  }

  const [topName, topCount] = entries[0];
  winnerBox.style.display = "block";
  winnerName.textContent = topName;
  winnerCount.textContent = `${topCount} ocorrência(s)`;

  for(const [name, count] of entries){
    const li = document.createElement("li");
    const left = document.createElement("span"); left.textContent = name;
    const right = document.createElement("span"); right.textContent = `${count} ocorrência(s)`;
    li.append(left, right);
    rankList.appendChild(li);
  }
}

document.getElementById("printBtn")?.addEventListener("click", ()=> window.print());
window.addEventListener("DOMContentLoaded", render);
