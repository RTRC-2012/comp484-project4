
const locations = [   // coordinates of each building with the precision Google offers upon right click
{name: "Asian American Activities Center", lat: 34.24423088155758, lng: -118.53378502836462, tolerance: 0.00075 },
{name: "Laurel Hall", lat: 34.242356138919945, lng: -118.52898095402787, tolerance: 0.00075 },
{name: "Sierra Hall", lat: 34.23832050902155, lng: -118.53070266812115, tolerance: 0.00075 },
{name: "Donald Bianchi Planetarium", lat: 34.23906011413383, lng: -118.52847048819267, tolerance: 0.00075 },
{name: "Bayramian Hall", lat: 34.2403935101752, lng: -118.53080498334336, tolerance: 0.00075 },
];

// gameIndex to track questions asked seperate from score
let gameIndex = 0;
let score = 0;
let innerMap;
let playerMark;
let correctMark;
let endMessage;
let timerInterval;
let timeLeft;
const START_TIME = 60;
let bestScore = parseInt(localStorage.getItem('gameBest') || '-1');

// declares map libraries and settings
async function initMap() {
  const [{ Map }, { AdvancedMarkerElement }] = await Promise.all([
    google.maps.importLibrary('maps'),
    google.maps.importLibrary('marker'),]);
  const mapElement = document.querySelector('gmp-map');
  innerMap = mapElement.innerMap;

  innerMap.setOptions({
    // make it a satellite map with only streets and disable navigation tools
    mapTypeId: 'hybrid', // strangely this was not determined by the mapID I connected in HTML
    tilt: 0,
    heading: 0,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    zoomControl: false,
    disableDoubleClickZoom: false,
    gestureHandling: 'none',
    rotateControl: false,
    cameraControl: false,
    keyboardShortcuts: false, // disables keyboard shortcuts like + - and ↓ ← ↑ → to avoid messing up my perfect map position
  });

  //double click listener that only works while the game is ongoing
  innerMap.addListener('dblclick', (event) => {
    if (gameIndex < 5 && timeLeft > 0){ handleClick(event, AdvancedMarkerElement);}});
  startQuiz();} //end initMap

// basic timer functions
function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;}}
function startTimer() {
  stopTimer();
  document.getElementById('timer').textContent = `Time: ${timeLeft}s`;
  timerInterval = setInterval(() => {
    timeLeft--;
    document.getElementById('timer').textContent = `Time: ${timeLeft}s`;
    if (timeLeft <= 0) {
      stopTimer();
      endQuiz();
    }}, 1000);}

    // defines starting values for gameIndex and score
function startQuiz() {
  gameIndex = 0;  score = 0;
  timeLeft = START_TIME;
  document.getElementById('score').textContent = `Score: ${score}/0`;
  document.getElementById('feedback').textContent = '';
  document.getElementById('highscore').textContent = bestScore >= 0 ? `Highscore: ${bestScore}` : 'Highscore: -';
  startTimer();
  showPrompt();
}
// gives the prompt for the location with current gameIndex and score determining variables
function showPrompt() {
  if (gameIndex >= locations.length) {
    endQuiz();
    return;  }
  const location = locations[gameIndex];
  document.getElementById('prompt').innerHTML = `Double-click where you think<span class="prompt2">${location.name}</span> is.`;
  document.getElementById('feedback').textContent = '';
  document.getElementById('timer').textContent = `Time: ${timeLeft}s`;
  document.getElementById('highscore').textContent = bestScore >= 0 ? `Highscore: ${bestScore}` : 'Highscore: -';
  clearMarkers();
}

// check if the user chose close enough coordinates
function handleClick(event, AdvancedMarkerElement) {
  const clickLat = event.latLng.lat();
  const clickLng = event.latLng.lng();
  const location = locations[gameIndex];
  const distance = Math.sqrt(
    Math.pow(clickLat - location.lat, 2) + Math.pow(clickLng - location.lng, 2)
  );   const isCorrect = distance < location.tolerance;
  // add standard point markers
  playerMark = new AdvancedMarkerElement({
    map: innerMap,
    position: { lat: clickLat, lng: clickLng },
    title: 'Your answer',});
  // determines feedback behavior based on if player was correct
  if (isCorrect) {
    document.getElementById('feedback').textContent = 'Correct';
    document.getElementById('feedback').className = 'feedback-correct';
    score++;
    colorCircle(location, 'green', AdvancedMarkerElement);
  } else {
    document.getElementById('feedback').textContent = 'Incorrect';
    document.getElementById('feedback').className = 'feedback-incorrect';
    colorCircle(location, 'red', AdvancedMarkerElement);
  // show right answer if wrong was given 
    correctMark = new AdvancedMarkerElement({
      map: innerMap,
      position: { lat: location.lat, lng: location.lng },
      title: 'Correct location',
    });}
    gameIndex++; //gameIndex icreases regardless of correct answer
    document.getElementById('score').textContent = `Score: ${score}/${gameIndex}`;
  setTimeout(showPrompt, 1000);
} // end of handleClick

// colors circle based on handleClick result
function colorCircle(location, color, AdvancedMarkerElement) {
  const circleColor = color === 'green' ? '#00ff00ff' : '#ff0000';
  new google.maps.Circle({
    center: { lat: location.lat, lng: location.lng },
    radius: 40,
    strokeColor: circleColor,
    fillOpacity: 0,
    strokeWeight: 3,
    map: innerMap,
  });
}

// if you go too fast it might fail, but otherwise it does remove markers between questions
// and leaves just a colored circle behind
function clearMarkers() {
  if (playerMark) {
    playerMark.map = null;
    playerMark = null;}
  if (correctMark) {
    correctMark.map = null;
    correctMark = null;}}

function endQuiz() {
  stopTimer();
  // determines message based on score, 'endMessage' was declared globally earlier but only used here
  if (score >= 3){
    endMessage = 'great job!';
  } else {
    endMessage = 'better luck next time.';
  }
  document.getElementById('prompt').textContent = 'Quiz Complete, ' + endMessage;
  document.getElementById('score').textContent = '';
  document.getElementById('feedback').textContent = `Final Score: ${score}/${locations.length}`;
  // doesn't use gameIndex so that it shows total possible in the event of time running out
  // color final score message
  if (score >= 3){
    document.getElementById('feedback').className = 'feedback-correct';
  } else {
    document.getElementById('feedback').className = 'feedback-incorrect';
  }
  // update highscore if needed
  const prevBest = parseInt(localStorage.getItem('gameBest') || '-1');
  if (score > prevBest) { //possibly deprecated feature once localStorage hits the max of 5
    localStorage.setItem('gameBest', score);
    bestScore = score;
    document.getElementById('feedback').textContent += ' - New Highscore!';
  }
  document.getElementById('highscore').textContent = bestScore >= 0 ? `Highscore: ${bestScore}` : 'Highscore: -';
}

initMap();