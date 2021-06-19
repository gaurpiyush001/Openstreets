'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

//let map, mapEvent;

class Workout {
  //private properties
  date = new Date();
  id = (Date.now() + '').slice(-10);

  constructor(coords, distance, duration) {
    // this.date = ...
    // this.id = ...
    this.coords = coords; // [latitude, longitude]
    this.distance = distance;
    this.duration = duration;
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

//child classes
class Runnning extends Workout {
  type = 'running'; //this will ne available on all the instances

  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;

    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    // min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

//child class
class Cycling extends Workout {
  type = 'cycling'; //this will ne available on all the instances

  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    // Km / hr
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

// const run1 = new Runnning([39,-12], 5.2, 24, 178);
// const cycling1 = new Cycling([39,-12], 27, 95, 523);
// console.log(run1, cycling1);

////////////////////////////////////////////////////////////////////////////////////////
////////////////// --------> APPLICATION ARCHITECTURE <----------- ////////////////////
class App {
  #map;
  #mapZoomLevel = 12;
  #mapEvent;
  #workouts = [];

  constructor() {
    //Gte User's position
    this._getPosition(); //This is called Constructor Method

    //Get Data
    this._getLocalStorage();

    //Attaching important event Handlers
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }

  _getPosition() {
    //--->GEOLOCATION API(it is an Browser API)<-----
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this), //important⚡⚡⚡⚡
        function () {
          alert('Could not get your Position 😕');
        }
      );
  }

  _loadMap(position) {

    const { longitude } = position.coords;
    const { latitude } = position.coords;
    //console.log(`https://www.google.com/maps/@${latitude},${longitude},15z`);

    const coords = [latitude, longitude];

    ////////////////////// LEAFLET Library for importing Map to our Application //////////////////////////

    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);//this will take some time to relaod asyn hai
    
    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    //this .on()-method is not coming from Javascript, This method is available on Leaflet Library
    //Handling Clicks on the Map
    this.#map.on('click', this._showForm.bind(this));

    this.#workouts.forEach(work => {
      this._renderWorkoutMarker(work);
    });
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;

    form.classList.remove('hidden');
    inputDistance.focus();
  }
  _hideForm(){
    //Empty Input;
    inputDistance.value =
    inputCadence.value =
    inputDuration.value =
    inputElevation.value =
      '';

    form.style.display = 'none';
    form.classList.add('hidden');
    //form.style.display = 'grid';
    setTimeout(()=>form.style.display='grid', 1000);///NICE TRICK😎😎😎
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    const validInputs = function (...inputs) {
      return inputs.every(inp => Number.isFinite(inp));
    };
    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    e.preventDefault();

    // Get data from form
    const type = inputType.value;
    const distance = +inputDistance.value; // converting STRING TO ---> NUMBER
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // If workout is ---> running ,, then create a RUNNING Object
    if (type === 'running') {
      const cadence = +inputCadence.value;

      //Chack data valid or NoT
      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      ) {
        return alert(`Input have to be +ve numbers`);
      }

      workout = new Runnning([lat, lng], distance, duration, cadence);
    }

    // If workout is ---> cycling ,, then create a CYCLING Object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;

      //Chack data valid or NoT
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert(`Input have to be +ve numbers`);

      //const cadence = + inputCadence.value;
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    // Add new Onject to workout array
    this.#workouts.push(workout);
    //console.log(workout);

    // Render workout on map as Marker
    this._renderWorkoutMarker(workout);

    // Render workout on List
    this._renderWorkout(workout);

    // Hide form + clear input field
    this._hideForm();

    // Set local storage to all workouts
    this._setLocalStorage();

    console.log(this.#mapEvent);

    console.log(lat, lng);
  }



  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(`${workout.type === 'running'? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`)
      .openPopup();
  }

  _renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
      <h2 class="workout__title">${workout.description}</h2>
      <div class="workout__details">
        <span class="workout__icon">${
          workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
        }</span>
        <span class="workout__value">${workout.distance}</span>
        <span class="workout__unit">km</span>
      </div>
        <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${workout.duration}</span>
        <span class="workout__unit">min</span>
      </div>
    `;

    if (workout.type === 'running') {
      html += `
    <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.pace.toFixed(1)}</span>
      <span class="workout__unit">min/km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">🦶🏼</span>
      <span class="workout__value">${workout.cadence}</span>
      <span class="workout__unit">spm</span>
    </div>
    </li>`;
    }


    if (workout.type === 'cycling'){
      html += `
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.speed.toFixed(1)}</span>
        <span class="workout__unit">km/h</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⛰</span>
        <span class="workout__value">${workout.elevationGain}</span>
        <span class="workout__unit">m</span>
      </div>
      </li> 
      `;
    }

    form.insertAdjacentHTML('afterend', html);
  }

  _moveToPopup(e){
    const workoutEl = e.target.closest('.workout');
    console.log(workoutEl);

    if(!workoutEl)  return; //gaurd clause
    
    const workout = this.#workouts.find(work => work.id === workoutEl.dataset.id);
    
    //console.log(workout);
    
    //now taking MAP to the Clicked Position by fetching coordinates
    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 2
      }
    }); 
  }


  _setLocalStorage() {

    localStorage.setItem('workouts',JSON.stringify(this.#workouts));

  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));

    if(!data) return;
    
    this.#workouts = data;

    this.#workouts.forEach(work => {
      this._renderWorkout(work);
    });
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload();
    //LOCATION is a big OBJECT that contains lot of properties and Methods in the BROWSER
  }

}


const app = new App();
