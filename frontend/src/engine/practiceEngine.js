export function startPracticeGame() {

const textDisplay = document.getElementById("text-display");
const input = document.getElementById("input");
const startBtn = document.getElementById("start");

let correctTyped = 0;
let mistakes = 0;
let totalTyped = 0;
let wpm = 0;
let accuracy = 0;

let currentIndex = 0;
let spans = [];

let timeLeft = 60;
let timerId = null;

const wordList = [
  "time","people","world","life","day",
  "practice","typing","speed","focus","skill",
  "give","fun","which","what","know",
  "learn","improve","keyboard","accuracy","game",
  "the","her","because"
];

function generateText(wordCount = 100) {

  let result = [];

  for (let i = 0; i < wordCount; i++) {
    const randomIndex = Math.floor(Math.random() * wordList.length);
    result.push(wordList[randomIndex]);
  }

  return result.join(" ");
}

function renderText(text) {

  textDisplay.innerHTML = "";
  currentIndex = 0;

  text.split("").forEach(char => {

    const span = document.createElement("span");
    span.innerText = char;
    textDisplay.appendChild(span);

  });

  spans = textDisplay.querySelectorAll("span");

  if (spans.length > 0)
    spans[0].classList.add("active");
}

startBtn.addEventListener("click", () => {

  resetGame();

  const text = generateText();
  renderText(text);

  input.disabled = false;
  input.value = "";
  input.focus();

  timeLeft = 60;
  updateTimerUI(timeLeft);

});

input.addEventListener("input", () => {

  if (!timerId) startTimer();
  if (timeLeft <= 0) return;

  const typedChar = input.value[currentIndex];
  const expectedChar = spans[currentIndex].innerText;

  if (!typedChar) return;

  spans[currentIndex].classList.remove("active");

  if (typedChar === expectedChar) {

    spans[currentIndex].classList.add("correct");
    correctTyped++;

  } else {

    spans[currentIndex].classList.add("wrong");
    mistakes++;

  }

  currentIndex++;

  if (currentIndex < spans.length)
    spans[currentIndex].classList.add("active");

});

input.addEventListener("keydown",(e)=>{
  if(e.key==="Backspace"){
    e.preventDefault();
  }
});

function startTimer(){

  timerId=setInterval(()=>{

    if(timeLeft<=0){

      updateTimerUI(0);
      endPractice();
      return;

    }

    timeLeft--;
    updateTimerUI(timeLeft);

  },1000);
}

function updateTimerUI(time){
  document.getElementById("timer").innerText=time;
}

function stopTimer(){

  clearInterval(timerId);
  timerId=null;

}

function endPractice(){

  stopTimer();
  input.disabled=true;

  totalTyped=correctTyped+mistakes;

  const words=totalTyped/5;

  wpm=Math.floor(words);

  accuracy=totalTyped===0 ? 0 : Math.round((correctTyped/totalTyped)*100);

  document.getElementById("wpm").innerText=wpm;
  document.getElementById("accuracy").innerText=accuracy;
  document.getElementById("mistakes").innerText=mistakes;

  showResults();
}

function showResults(){

  document.querySelector(".main").classList.add("hidden");
  document.querySelector(".result").classList.remove("hidden");

}

function resetGame(){

  stopTimer();

  correctTyped=0;
  mistakes=0;
  totalTyped=0;
  wpm=0;
  accuracy=0;
  currentIndex=0;

  input.value="";
  input.disabled=true;

  document.querySelector(".result").classList.add("hidden");
  document.querySelector(".main").classList.remove("hidden");

}

document.getElementById("restart").addEventListener("click",resetGame);

}