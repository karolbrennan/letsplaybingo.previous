import React from 'react';

class ReleaseNotes extends React.Component {
  render() {
    return(
      <section>
        <div className="row">
          <div className="col padding-xxlg">
            <h1>Release Notes!</h1>
            <h2><span className="date">4/25/2020</span> | The Pandemic Update!</h2>
            <ul>
                <li>A brand new <a href="https://letsplaybingo.io/generate">card generation tool</a>!!! You asked, we listened!
                  <p>You can now generate your own bingo cards and print them at home on any standard printer! All cards are created individually and completely at random and the chances of duplicate cards are extremely slim.</p>
                </li>
                <li>New design and layout!
                  <p>The new layout and design optimizes the available space when sharing or projecting to a big screen, making playing Let's Play Bingo with your friends and family that much easier!</p></li>
                <li>New patterns and number skipping!
                  <p>More preset patterns and the ability to skip numbers that are not used in the selected or custom pattern! <br/>
                  <em>Be sure to turn this feature off if you're doing back to back patterns in a single game without a board reset!</em></p></li>
                <li>A manual display board option for those who have a number generation tool and only need a way to display called numbers.</li>
              </ul>
          </div>
        </div>
      </section>
    )
  }
}

export default ReleaseNotes;