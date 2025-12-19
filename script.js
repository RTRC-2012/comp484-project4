
const locations = [   // coordinates of each building with the precision Google offers
  { name: "Asian American Activities Center", lat: 34.24423088155758, lng: -118.53378502836462, tolerance: 0.00075 },
  { name: "Laurel Hall", lat: 34.242356138919945, lng: -118.52898095402787, tolerance: 0.00075 },
  { name: "Sierra Hall", lat: 34.23832050902155, lng: -118.53070266812115, tolerance: 0.00075 },
  { name: "Donald Bianchi Planetarium", lat: 34.23906011413383, lng: -118.52847048819267, tolerance: 0.00075 },
  { name: "Bayramian Hall", lat: 34.2403935101752, lng: -118.53080498334336, tolerance: 0.00075 },
];

let index = 0;
let score = 0;
let innerMap;
let userMarker;
let correctMarker;
let end;
let timerInterval;
let timeLeft;
const START_TIME = 60;
let bestScore = parseInt(localStorage.getItem('csun_bestScore') || '-1');

// declare map libraries and settings
async function initMap() {
  const [{ Map }, { AdvancedMarkerElement }] = await Promise.all([
    google.maps.importLibrary('maps'),
    google.maps.importLibrary('marker'),
  ]);

  const mapElement = document.querySelector('gmp-map');
  innerMap = mapElement.innerMap;

  innerMap.setOptions({
    // make it a satellite map with only streets and disable navigation tools
    mapTypeId: 'hybrid',
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
    keyboardShortcuts: false,
  });

  //double click listener
  innerMap.addListener('dblclick', (event) => {
    if (index < 5){ handleClick(event, AdvancedMarkerElement);}
  });

  startQuiz();
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function startTimer() {
  stopTimer();
  document.getElementById('timer').textContent = `Time: ${timeLeft}s`;
  timerInterval = setInterval(() => {
    timeLeft--;
    document.getElementById('timer').textContent = `Time: ${timeLeft}s`;
    if (timeLeft <= 0) {
      stopTimer();
      endQuiz();
    }
  }, 1000);
}

function startQuiz() {
  index = 0;
  score = 0;
  timeLeft = START_TIME;
  document.getElementById('score').textContent = `Score: ${score}/0`;
  document.getElementById('feedback').textContent = '';
  document.getElementById('highscore').textContent = bestScore >= 0 ? `Highscore: ${bestScore}` : 'Highscore: -';
  startTimer();
  showPrompt();
}

function showPrompt() {
  if (index >= locations.length) {
    endQuiz();
    return;
  }
  const location = locations[index];
  document.getElementById('prompt').innerHTML = `Double-click where you think<span class="prompt2">${location.name}</span> is.`;
  document.getElementById('feedback').textContent = '';
  document.getElementById('timer').textContent = `Time: ${timeLeft}s`;
  document.getElementById('highscore').textContent = bestScore >= 0 ? `Highscore: ${bestScore}` : 'Highscore: -';
  clearMarkers();
}

// check if the user is correct and update numbers
function handleClick(event, AdvancedMarkerElement) {
  const clickLat = event.latLng.lat();
  const clickLng = event.latLng.lng();
  const location = locations[index];
  const distance = Math.sqrt(
    Math.pow(clickLat - location.lat, 2) + Math.pow(clickLng - location.lng, 2)
  );   const isCorrect = distance < location.tolerance;

  // add markers
  userMarker = new AdvancedMarkerElement({
    map: innerMap,
    position: { lat: clickLat, lng: clickLng },
    title: 'Your answer',
  });

  if (isCorrect) {
    document.getElementById('feedback').textContent = 'Correct';
    document.getElementById('feedback').className = 'feedback-correct';
    score++;
    colorCircle(location, 'green', AdvancedMarkerElement);
  } else {
    document.getElementById('feedback').textContent = 'Incorrect';
    document.getElementById('feedback').className = 'feedback-incorrect';
    colorCircle(location, 'red', AdvancedMarkerElement);
    // show right answer if wrong is given 
    correctMarker = new AdvancedMarkerElement({
      map: innerMap,
      position: { lat: location.lat, lng: location.lng },
      title: 'Correct location',
    });
  }

  document.getElementById('score').textContent = `Score: ${score}/${index + 1}`;
  index++;
  setTimeout(showPrompt, 1000);
}

function colorCircle(location, color, AdvancedMarkerElement) {
  const circleColor = color === 'green' ? '#00ff00ff' : '#ff0000';
  new google.maps.Circle({
    center: { lat: location.lat, lng: location.lng },
    radius: 40,
    strokeColor: circleColor,
    fillOpacity: 0,
    strokeWeight: 2.5,
    map: innerMap,
  });
}

function clearMarkers() {
  if (userMarker) {
    userMarker.map = null;
    userMarker = null;
  }
  if (correctMarker) {
    correctMarker.map = null;
    correctMarker = null;
  }
}

function endQuiz() {
  stopTimer();
  // determine end message based on score
  if (score >= 3){
    end = 'great job!';
  } else {
    end = 'better luck next time.';
  }
  document.getElementById('prompt').textContent = 'Quiz Complete, ' + end;
  document.getElementById('score').textContent = '';
  document.getElementById('feedback').textContent = `Final Score: ${score}/${locations.length}`;
  // color final score message
  if (score >= 3){
    document.getElementById('feedback').className = 'feedback-correct';
  } else {
    document.getElementById('feedback').className = 'feedback-incorrect';
  }
  // update highscore if needed
  const prevBest = parseInt(localStorage.getItem('csun_bestScore') || '-1');
  if (score > prevBest) {
    localStorage.setItem('csun_bestScore', score);
    bestScore = score;
    document.getElementById('feedback').textContent += ' - New Highscore!';
  }
  document.getElementById('highscore').textContent = bestScore >= 0 ? `Highscore: ${bestScore}` : 'Highscore: -';
}

initMap();