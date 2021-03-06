import React from 'react';
import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header>
      <h1>
        <Link to='/'>ENSTARS STORY FORMATTER</Link>
      </h1>
      <div className="horizontal">
        <p>
          A website to more easily upload event/gacha stories from the mobile idol game Ensemble Stars to the fandom wiki.
          <br />It takes formats your story chapter into text that can be pasted directly into the "source"
        section of the page.
          <br />Developed by <a target="_blank" href="https://twitter.com/gayandasleep">midori</a> (last updated 7/18/20).
        </p>
        <ul id="navbar">
          <li><Link to='/howto'>HOW TO USE</Link></li>
          <li><a target="_blank" href="https://goo.gl/forms/Xu42LLAgWKxVYV873">CONTACT</a></li>
          <li><a target="_blank" href="https://github.com/myang5/enstars-wiki-parser">GITHUB</a></li>
        </ul>
      </div>
    </header>
  )
}