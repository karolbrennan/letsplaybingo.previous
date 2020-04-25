/*
 * Let's Play Bingo
 * App written by Karol Brennan
 * https://karol.dev
 * http://github.com/karolbrennan
 */
// Dependencies
import React, {Component} from 'react';
import Slider from 'rc-slider';
import Select from 'react-select';

// Custom Components
import BingoBoard from './BingoBoard.js';
import Pattern from './Pattern.js';

// Utilities
import { generateBingoBalls, getRandomBingoNumber, getPresetPatterns, getBallDisplay, getLogoBallDisplay, getLanguageText} from '../utils.js';

class BingoGame extends Component {
  constructor(props) {
    super(props);
    // Set initial state
    // Generate bingo balls
    this.patternPlaceholder = "Choose a pattern";
    this.state = {
      board: generateBingoBalls(),
      previousBall: null,
      currentBall: null,
      totalBallsCalled: 0,
      running: false,
      interval: null,
      delay: 6000,
      presets: getPresetPatterns(),
      selectedPattern: {
        value: this.patternPlaceholder,
        label: this.patternPlaceholder,
        pattern: {
          B: [false, false, false, false, false],
          I: [false, false, false, false, false],
          N: [false, false, false, false, false],
          G: [false, false, false, false, false],
          O: [false, false, false, false, false]
        }
      },
      // Speech synthesis
      speechEnabled: window.hasOwnProperty('speechSynthesis'),
      synth: window.speechSynthesis,
      selectedCaller: null,
      // Checkbox values
      skipUnused: true,
      wildBingo: false,
      enableCaller: true,
      displayBoardOnly: false
    }
    // if speech is enabled, initialize other speech properties
    if (this.state.speechEnabled) {
      this.state.synth.onvoiceschanged = this.loadVoices;
      this.state.voices = this.state.synth.getVoices();
    }
  }

  initializeFromLocalStorage = () => {
    let skipUnused, enableCaller, displayBoardOnly, wildBingo, callDelay = false;

    if(localStorage.getItem('lpb-callDelay')){
      callDelay = localStorage.getItem('lpb-callDelay') === "true";
    }
    if(localStorage.getItem('lpb-skipUnused')){
      skipUnused = localStorage.getItem('lpb-skipUnused') === "true";
    }
    if(localStorage.getItem('lpb-enableCaller')){
      enableCaller = localStorage.getItem('lpb-enableCaller') === "true";
    }
    if(localStorage.getItem('lpb-displayBoardOnly')){
      displayBoardOnly = localStorage.getItem('lpb-displayBoardOnly') === "true";
    }
    if(localStorage.getItem('lpb-wildBingo')){
      wildBingo = localStorage.getItem('lpb-wildBingo') === "true";
    }

    this.setState({
      skipUnused: skipUnused, enableCaller: enableCaller, displayBoardOnly: displayBoardOnly, wildBingo: wildBingo, delay: callDelay
    })
  }

  /**
   * In case of going from one page to another, when we return
   * and the component has mounted reinitialize the game from
   * local storage.
   *
   */
  componentDidMount(){
    this.initializeFromLocalStorage();
    this.loadVoices();
  }

  /* ------------------- Speech Synthesis Functions */
  /*
   *  Load Voices Function
   *  Will load voices as they change within the browser
   */
  loadVoices = () => {
    let voices = this.state.synth.getVoices();
    let caller = null;
    if(localStorage.getItem('lpb-selectedCaller')){
      let selectedCaller = JSON.parse(localStorage.getItem('lpb-selectedCaller'));
      voices.forEach(voice => {
        if(voice.name === selectedCaller.value){
          caller = voice;
        }
      })
    }
    this.setState({voices: voices, selectedCaller: caller});
  };

  /*
   *  Say Function
   *  Will speak any string that is passed in
   */
  say = (text) => {
    if (this.state.speechEnabled && this.state.enableCaller) {
      // Create a new instance of SpeechSynthesisUtterance.
      let msg = new SpeechSynthesisUtterance();
      msg.text = text;
      if (this.state.hasOwnProperty('selectedCaller')) {
        msg.voice = this.state.selectedCaller;
      }
      this.cancelSpeech();
      this.state.synth.speak(msg);
    }
  };

  /**
   * Cancel speech function
   * Will cancel any existing speech
   */
  cancelSpeech = () => {
    if(window.speechSynthesis.speaking){
      window.speechSynthesis.cancel();
    }
  };

  voiceCall = (ball) => {
    // call the new ball, first call it all together, then call each character individually
    let ballstring = ball.number.toString();
    this.say([ball.letter, ball.number, ' ', ' ', ball.letter, ' ',
      (ballstring.length === 2 ? [ballstring.charAt(0), ' ', ballstring.charAt(1)] : ball.number)]);
  }

  wildBallCall = (ball) => {
    // call the wild ball, 
    let ballstring = ball.number.toString();
    this.say(['The wild number ', ' ', ' ', ball.letter, ' ', ball.number, ' ', ' ', ' mark every number ending in ', ballstring.substr(-1)]);
  }


  /* ------------------- Gameplay Functions */

  startNewGame = (event) => {
    // Start with the Let's Play Bingo call out 
    // (the .say method will not run if caller is not enabled)
    if(this.state.wildBingo){
      this.say("Let's Play Wild Bingo!");
      window.setTimeout(() => {
        // Variables used for wild bingo
        let randomBingoNumber = getRandomBingoNumber();
        let wildNumber = randomBingoNumber.toString().substr(-1);
        let wildBall = null;
        let lastBall = null;
        let board = this.state.board;
        let totalBallsCalled = this.state.totalBallsCalled;

        Object.keys(board).forEach(letter => {
          board[letter].forEach(number => {
            if(number.number === randomBingoNumber){
              number.called = true;
              number.active = true;
              wildBall = number;
              totalBallsCalled++;

              window.setTimeout(() => {
                this.wildBallCall(number);
              },2500);
            }
            if(number.number.toString().substr(-1) === wildNumber){
              lastBall = number;
              number.called = true;
              totalBallsCalled++;
            }
            return number;
          })
          return letter;
        });
        this.setState({
          board: board,
          previousBall: lastBall,
          currentBall: wildBall,
          totalBallsCalled: totalBallsCalled
        });
      },2500)
    } else {
      this.say("Let's Play Bingo!");
      window.setTimeout(() => {this.callBingoNumber();},2500);
    }
  }

  startNewAutoplayGame = () => {
    if(this.state.wildBingo){
      this.startNewGame();
    } else {
      this.say("Let's Play Bingo!");
      window.setTimeout(()=> {
        this.toggleGame();
      },2000);
    }
  }

  toggleGame = () => {
    let running = this.state.running;
    let interval = null;
    if(running){
      clearInterval(this.state.interval);
    } else {
      this.callBingoNumber();
      interval = setInterval(this.callBingoNumber, this.state.delay);
    }
    this.setState({
      running: !running,
      interval: interval
    });
  }

  resetGame = () => {
    clearInterval(this.state.interval);
    this.cancelSpeech();
    this.setState({
      board: generateBingoBalls(),
      previousBall: null,
      currentBall: null,
      totalBallsCalled: 0,
      running: false,
      interval: null
    })
  }

  callBingoNumber = () => {
    let board = this.state.board;
    let running = this.state.running;
    let currentBall = null;
    let previousBall = this.state.currentBall;
    let updateState = false;
    let totalBallsCalled = this.state.totalBallsCalled;
    let selectedPattern = this.state.selectedPattern;
    let randomBingoNumber = getRandomBingoNumber();

    if(totalBallsCalled < 75){
      let callAgain = false;
      Object.keys(board).map(letter => {
        board[letter].map((number)=>{
          number.active = false;
          if(number.number === randomBingoNumber){
            if(number.called){
              callAgain = true;
            } else {
              updateState = true;
              number.called = true;
              number.active = true;
              currentBall = number;
              callAgain = this.state.skipUnused && selectedPattern.value !== this.patternPlaceholder && selectedPattern.unusedLetters.indexOf(letter) >= 0;

              if(callAgain){
                number.active = false;
              } else {
                this.voiceCall(number);
              }
              totalBallsCalled++;
            }
          }
          return number;
        })
        return letter;
      })
      if(callAgain){
        this.callBingoNumber();
      }
    } else {
      // stop running if there's 75+ balls called.
      running = false;
    }
    if(updateState){
      this.setState({
        board: board,
        running: running,
        currentBall: currentBall,
        previousBall: previousBall,
        totalBallsCalled: totalBallsCalled
      });
    }
  }


  /* ------------------ Handlers */
  handleDelayChange = (e) => {
    if(this.state.interval !== null){
      clearInterval(this.state.interval);
      this.setState({delay: e, interval: setInterval(this.callBingoNumber, e)});
      localStorage.setItem('lpb-callDelay', e);
    } else {
      this.setState({delay: e});
    }
  }

  handleCheckbox = (e) => {
    let gamemode = e.currentTarget.dataset.gamemode;
    switch(gamemode){
      case 'skip-unused':
        this.setState({skipUnused: e.currentTarget.checked});
        localStorage.setItem('lpb-skipUnused', e.currentTarget.checked);
        break;
      case 'wild-bingo':
        this.setState({wildBingo: e.currentTarget.checked});
        localStorage.setItem('lpb-wildBingo', e.currentTarget.checked);
        break;
      case 'enable-caller':
        if(this.state.synth.speaking){
          this.cancelSpeech();
        }
        this.setState({enableCaller: e.currentTarget.checked});
        localStorage.setItem('lpb-enableCaller', e.currentTarget.checked);
        break;
      case 'display-board':
        if(e.currentTarget.checked && this.state.running){
          clearInterval(this.state.interval);
        }
        this.setState({displayBoardOnly: e.currentTarget.checked, running: false});
        localStorage.setItem('lpb-displayBoardOnly', e.currentTarget.checked);
        break;
      default:
        break;
    }
  }

  handleUpdatePattern = (pattern, letter, index, slot) => {
    pattern[letter][index] = !slot;
    let unusedLetters = [];
    Object.keys(pattern).map(letter => {
      if(pattern[letter].indexOf(true) < 0){
        unusedLetters.push(letter);
      }
      return letter;
    })
    let customPattern = {value: "Custom", label: "Custom", unusedLetters: unusedLetters, pattern: pattern};
    this.setState({selectedPattern: customPattern});
  };

  handleChoosePattern = (e) => {
    this.setState({
      selectedPattern: e
    })
  };

  /* ------------------- JSX Display Functions */
  
  /**
   * Returns a JSX element to display the current ball
   *
   * @return  {JSX}  JSX Element
   */
  get currentBallDisplay(){
    return this.state.currentBall !== null ? getBallDisplay(this.state.currentBall) : getLogoBallDisplay();
  }

  /**
   * Returns a JSX element to display the previous ball
   *
   * @return  {JSX}  JSX Element
   */
  get previousBallDisplay(){
    return this.state.previousBall !== null ? getBallDisplay(this.state.previousBall) : getLogoBallDisplay();
  }

  /**
   * Get Number Display shown above the pattern display
   *
   * @return  {JSX}  html element
   */
  get numberDisplay() {
    let numbers = this.state.totalBallsCalled.toString().split('');
    if(numbers.length === 1){
      return <div><span>&nbsp;</span><span>{numbers[0]}</span></div>
    } else {
      return numbers.map((number, index) => (
        <span key={"numDisplay" + number + index}>{number}</span>
      ))
    }
  }

  /**
   * Get the current call display
   *
   * @return  {JSX}  html element
   */
  get currentCallDisplay() {
    const currentCall = this.state.currentBall;
    if(currentCall){
      let numbers = ["0"];
      if(currentCall.hasOwnProperty('number')){
        numbers = currentCall.number.toString().split('');
      }
      if(numbers.length === 1){
        return <div><span>&nbsp;</span><span>{numbers[0]}</span></div>
      } else {
        return numbers.map((number, index) => (
          <span key={"call" + number + index}>{number}</span>
        ))
      }
    } else {
      return <div><span>&nbsp;</span><span>&nbsp;</span></div>
    }
  }

  /**
   * Get the previous call display
   *
   * @return  {JSX}  html element
   */
  get previousCallDisplay() {
    const previousCall = this.state.previousBall;
    if(previousCall){
      let numbers = ["0"];
      if(previousCall.hasOwnProperty('number')){
        numbers = previousCall.number.toString().split('');
      }
      if(numbers.length === 1){
        return <div><span>&nbsp;</span><span>{numbers[0]}</span></div>
      } else {
        return numbers.map((number, index) => (
          <span key={"call" + number + index}>{number}</span>
        ))
      }
    } else {
      return <div><span>&nbsp;</span><span>&nbsp;</span></div>
    }
  }

  /* ------------------- Voice Synthesis */
  
  /**
   * Returns the options for the voice selection menu
   *
   * @return  {Array}  Options array
   */
  get voiceOptions(){
    let voiceOptions = [];
    if(this.state.speechEnabled){
      this.state.voices.forEach(voice => {
        let voiceObj = voice;
        voiceObj.value = voice.name;
        voiceObj.label = voice.name + ' / ' + getLanguageText(voice.lang);
        voiceOptions.push(voiceObj);
      })
    }
    return voiceOptions;
  }

  /*
  *  Choose Caller Function
  *  This sets the selected caller
  */
  handleChooseCaller = (e) => {
    this.setState({
      selectedCaller: e
    })
    localStorage.setItem('lpb-selectedCaller', JSON.stringify(e));
  };

  /* ------------------- Display Board Only */
  manualCall = (ball) => {
    let board = this.state.board;
    let currentBall = null;
    let previousBall = this.state.currentBall;
    let totalBallsCalled = this.state.totalBallsCalled;
    Object.keys(board).forEach(letter => {
      board[letter].forEach(number => {
        number.active = false;
        if(ball.number === number.number){
          if(number.called){
            number.called = false;
            totalBallsCalled--;
          } else {
            number.called = true;
            number.active = true;
            totalBallsCalled++;
            currentBall = number;
          }
        }
        return number;
      })
      return letter;
    })
    this.setState({board: board, currentBall: currentBall, previousBall: previousBall, totalBallsCalled: totalBallsCalled});
  }


  /* ------------------- Render */
  render(){
    return(
      <div className="dark-bg light-links">
        <section className="dark-blue-bg padding-sm"></section>
        {/* ----------- Bingo Board ------------- */}
        <section className="board-block">
          <div className="row no-wrap align-stretch">
            {/* ------ Board ------- */}
            <div className="col pattern-side shrink min-size-200 padding-xlg">
              {/* -------- Digital Displays --------- */}
              <div className="row no-wrap margin-bottom-lg justify-space-between white-text">
                <div className="col text-center margin-sm">
                  <div className="callNumber">{this.numberDisplay}</div>
                  <div className="callNumber-text uppercase">Total Calls</div>
                </div>
                <div className="col text-center margin-sm">
                  <div className="callNumber">{this.previousCallDisplay}</div>
                  <div className="callNumber-text uppercase">Previous Call</div>
                </div>
              </div>

              {/* -------- Pattern --------- */}
                <Pattern pattern={this.state.selectedPattern} update={this.handleUpdatePattern} />
                <div className="padding-vertical-lg">
                  <Select 
                    className="pattern-select"
                    placeholder="Choose Pattern"
                    value={this.state.selectedPattern}
                    onChange={this.handleChoosePattern}
                    options={this.state.presets}
                  />
                </div>
            </div>
            <div className="col board-side">
              <BingoBoard board={this.state.board} manualMode={this.state.displayBoardOnly} manualCall={this.manualCall} />
            </div>

          </div>
        </section>

        <section className="dark-blue-bg padding-sm"></section>


        {/* ----------- BOTTOM SECTION ------------- */}
        
        <section className="game-controls dark-bg">
          <div className="row justify-start align-start">

            {/* ----------- Current Ball Display ------------- */}
            <div className="col max-size-250 padding-vertical-xxlg padding-horizontal-md">
              {this.currentBallDisplay}
            </div>

            {/* ----------- Gameplay Controls ------------- */}
            <div className="col shrink padding-vertical-xxlg padding-horizontal-md">
              <section className="gameplay-controls">

                <button data-disabled={this.state.displayBoardOnly} onClick={this.state.totalBallsCalled === 0 ? this.startNewGame : this.callBingoNumber} disabled={this.state.running}>
                  {this.state.totalBallsCalled === 0 ? "Start New Game" : "Call Next Number"}
                </button>

                <button data-disabled={this.state.displayBoardOnly} data-newgame={this.state.totalBallsCalled === 0}
                  onClick={this.state.totalBallsCalled === 0 ? this.startNewAutoplayGame : this.toggleGame}>
                    {this.state.running ? "Pause Autoplay" : "Start Autoplay"}
                </button>

                <button onClick={this.resetGame} disabled={this.state.running || this.state.totalBallsCalled === 0}>
                  Reset Board
                </button>
              </section>
            </div>

            {/* ----------- Game Settings ------------- */}
            <div className="col no-wrap padding-vertical-xxlg padding-horizontal-md white-text">
              <section className="game-settings">

                {/* ----------- Autoplay Settings ---------- */}
                <div className="row no-wrap align-center justify-start">
                  <div className="col shrink min-size-150 padding-horizontal-lg">
                    <h4 className="no-margin blue-text">Autoplay Speed:</h4>
                  </div>
                  <div className="col shrink text-center padding-vertical-lg padding-horizontal-lg">
                    <div className="row no-wrap align-center" data-disabled={this.state.displayBoardOnly}>
                      <div className="col shrink padding-right-lg white-text">Slower</div>
                      <div className="col"><Slider min={2500} max={10000} step={500} value={this.state.delay} onChange={this.handleDelayChange} reverse={true} /></div>
                      <div className="col shrink padding-left-lg white-text">Faster</div>
                    </div>
                  </div>
                </div>
              
                {/* ----------- Gameplay Settings ---------- */}
                <div className="row no-wrap align-center justify-start">
                  <div className="col shrink min-size-150 padding-horizontal-lg">
                    <h4 className="no-margin blue-text">Gameplay Settings:</h4>
                  </div>
                  <div className="col padding-horizontal-lg">
                    <label className={this.state.displayBoardOnly ? 'toggle checked' : 'toggle'}>
                      <input type="checkbox" data-gamemode="display-board" onChange={this.handleCheckbox} checked={this.state.displayBoardOnly}></input>
                      <span>Manual Calling Mode</span>
                      <span className="toggle-span"></span>
                    </label>
                  </div>
                  <div className="col padding-horizontal-lg" data-disabled={this.state.displayBoardOnly}>
                    <label className={this.state.skipUnused ? 'toggle checked' : 'toggle'}>
                      <input type="checkbox" data-gamemode="skip-unused" onChange={this.handleCheckbox} checked={this.state.skipUnused}></input>
                      <span>Skip Unused Numbers</span>
                      <span className="toggle-span"></span>
                    </label>
                  </div>
                  <div className="col padding-horizontal-lg" data-disabled={this.state.displayBoardOnly}>
                    <label className={this.state.wildBingo ? 'toggle checked' : 'toggle'}>
                      <input type="checkbox" data-gamemode="wild-bingo" onChange={this.handleCheckbox} checked={this.state.wildBingo}></input>
                      <span>Wild Bingo</span>
                      <span className="toggle-span"></span>
                    </label>
                  </div>
                </div>


                {/* ----------- Caller Settings ---------- */}
                <div className="row no-wrap align-center justify-start">
                  <div className="col shrink min-size-150 padding-horizontal-lg">
                    <h4 className="no-margin blue-text">Bingo Caller:</h4>
                  </div>
                  <div className="col grow padding-horizontal-lg" data-disabled={this.state.displayBoardOnly}>
                    <div className="row no-wrap">
                      <div className="col shrink">
                        <label className={this.state.enableCaller ? 'toggle checked' : 'toggle'}>
                          <input type="checkbox" data-gamemode="enable-caller" onChange={this.handleCheckbox} checked={this.state.enableCaller}></input>
                          <span>Enable</span>
                          <span className="toggle-span"></span>
                        </label>
                      </div>
                      <div className="col padding-horizontal-xxlg" data-disabled={this.state.displayBoardOnly} data-visibility={this.state.enableCaller ? "show" : "hide"}>
                        <Select 
                          className="voice-select"
                          placeholder="Choose Caller"
                          value={this.state.selectedCaller}
                          onChange={this.handleChooseCaller}
                          options={this.voiceOptions}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
              </section>
            </div>

            {/* ----------- Donation ------------- */}
            <div className="col grow padding-vertical-xxlg padding-horizontal-lg white-text">
              <h3 className="no-margin">Donate to Let's Play Bingo!</h3>
              <p className="wrap-text small-text">
                <strong>Let's Play Bingo is the #1 Bingo Caller on Google!</strong><br/>
                Requiring no downloads, and with no ads, it is completely <strong>free</strong> and always will be.
                If you'd like to contribute toward operating costs we are accepting <a href="/donate">donations</a> of any amount 
                via <a href="https://venmo.com/karolbrennan" target="_blank" rel="noopener noreferrer">Venmo</a> or <a href="https://paypal.me/karolbrennan" target="_blank" rel="noopener noreferrer">Paypal</a>!
              </p>
              <p><a href="/donate" className="button">Donate Now</a></p>
            </div>

          </div>
        </section>
      </div>
    )
  }
}

export default BingoGame;