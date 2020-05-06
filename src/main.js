const namesLink = {
  TETORA: 'Tetora_Nagumo',
  HAJIME: 'Hajime_Shino',
  TOMOYA: 'Tomoya_Mashiro',
  HINATA: 'Hinata_Aoi',
  MIDORI: 'Midori_Takamine',
  TORI: 'Tori_Himemiya',
  SHINOBU: 'Shinobu_Sengoku',
  MITSURU: 'Mitsuru_Tenma',
  YUTA: 'Yuta_Aoi',
  TSUKASA: 'Tsukasa_Suou',
  SORA: 'Sora_Harukawa',
  SUBARU: 'Subaru_Akehoshi',
  HOKUTO: 'Hokuto_Hidaka',
  MAKOTO: 'Makoto_Yuuki',
  SOUMA: 'Souma_Kanzaki',
  ADONIS: 'Adonis_Otogari',
  NATSUME: 'Natsume_Sakasaki',
  KOGA: 'Koga_Oogami',
  RITSU: 'Ritsu_Sakuma',
  MAO: 'Mao_Isara',
  YUZURU: 'Yuzuru_Fushimi',
  ARASHI: 'Arashi_Narukami',
  MIKA: 'Mika_Kagehira',
  EICHI: 'Eichi_Tenshouin',
  KEITO: 'Keito_Hasumi',
  KAORU: 'Kaoru_Hakaze',
  IZUMI: 'Izumi_Sena',
  CHIAKI: 'Chiaki_Morisawa',
  SHU: 'Shu_Itsuki',
  MADARA: 'Madara_Mikejima',
  KURO: 'Kuro_Kiryu',
  WATARU: 'Wataru_Hibiki',
  KANATA: 'Kanata_Shinkai',
  REI: 'Rei_Sakuma',
  NAZUNA: 'Nazuna_Nito',
  LEO: 'Leo_Tsukinaga',
  TSUMUGI: 'Tsumugi_Aoba',
  JIN: 'Jin_Sagami',
  AKIOMI: 'Akiomi_Kunugi',
  HIYORI: 'Hiyori_Tomoe',
  JUN: 'Jun_Sazanami',
  NAGISA: 'Nagisa_Ran',
  IBARA: 'Ibara_Saegusa',
  RINNE: 'Rinne_Amagi',
  HIMERU: 'HiMERU',
  KOHAKU: 'Kohaku_Oukawa',
  NIKI: 'Niki_Shiina',
  HIIRO: 'Hiiro_Amagi',
  AIRA: 'Aira_Shiratori',
  MAYOI: 'Mayoi_Ayase',
  TATSUMI: 'Tatsumi_Kazehaya'
};

//copies text to clipboard
function copyToClip() {
  document.querySelector('#output').select();
  document.execCommand("copy");
  document.querySelector('#copyBtn').innerHTML = 'Copied';
}

//lmao
function convertToDom(data) {
  return new DOMParser().parseFromString(data, 'text/html');
}

//each line in CKEditor has <p> wrapper
//editorDom: editor data already converted to DOM object
//returns an Array of each line of text
function getTextFromDom(editorDom) {
  const paragraphs = editorDom.querySelectorAll('p'); //NodeList of all p elements
  const input = []
  paragraphs.forEach(function (p) {
    input.push(p.textContent.replace(/&nbsp;/g, ''));
  });
  return input;
}

//every line in CKEditor will always be in a <p> element
//<br> tags will always be in a <p> element
//goal is to identify new lines, move them into <p> elements, and add them to the document body in the correct order
//pasting from dreamwidth seems to add 2 <br> tags per double line
//possible case includes nested <p> tags but I haven't seen that yet, assume all <br> tags have <p> parents which are childNodes of body
//https://javascript.info/selection-range
function extractBr(inputDom) {
  let hasBr = inputDom.querySelectorAll('br');
  if (hasBr.length > 0) {
    //console.log('has br tags');
    for (let i = 0; i < hasBr.length; i++) {
      let parent = hasBr[i].parentNode;
      let insertInto = parent.parentNode;
      let range = new Range()
      range.setStart(hasBr[i].parentNode, 0);
      range.setEndAfter(hasBr[i]);
      let newP = document.createElement(parent.tagName.toLowerCase());
      newP.append(range.extractContents());
      insertInto.insertBefore(newP, parent);
      hasBr[i].remove();
    }
    //console.log(inputDom);
  }
  return inputDom;
}

//How formatter converts text (a rough summary)
//Types of lines:
//  Filename (for images) - formatter checks if file extension like .png exists in line (since this probably wouldn't show up in a dialogue line)
//  Dialogue line (no label) - formatter checks if first word has no colon. Formatter assumes label-less lines that aren't filenames are dialogue lines
//  Location: label
//  Heading: label
//  Name: label
//Formatter identifies labels by checking if first word has a colon character (str.split(' '))
//Formatter assumes the label is only one word long
//Formatter assumes all the other words are part of the line/heading

//need to account for text styling and how it might interfere with parsing
//code has to handle partial line styling and whole line styling
//TLers may paste code from their dreamwidth accounts where they bold/italicize names/headings
//case 1: no styling, <p> only contains text
//case 3: styling on non-label lines
//case 3a: styling on filenames ex. <p><strong>filename</strong></p>
//case 3b: styling in dialogue lines (probably intentional) ex. <p><strong>dialogue line</strong></p>
//case 3c: partial styling on dialogue lines ex. <p>dialogue <strong>line</strong></p>
//case 4: styling on label lines
//case 4a: styling on labels ex. <p><strong>Ritsu:</strong> dialogue line</p>
//case 4b: styling on informational headings <p><strong>Location: Hallway</strong</p>
//case 4c: other partial styling variations

//What styling should be kept?
//Only styling on the dialogue lines (excluding labels)
//How to detect dialogue line styling vs. other styling?
//Evaluate <p>.innerText and then decide from there

function convertText() {

  document.querySelector('#copyBtn').innerHTML = 'Copy Output';

  const values = getValues(); //get user input from all the tabs

  //wiki code templates
  const header =
    `{| class="article-table" cellspacing="1/6" cellpadding="2" border="1" align="center" width="100%"
! colspan="2" style="text-align:center;background-color:${values.writerCol}; color:${values.textCol};" |'''Writer:''' ${values.author}
|-
| colspan="2" |[[File:HEADERFILE|660px|link=|center]]
|-
! colspan="2" style="text-align:center;background-color:${values.locationCol}; color:${values.textCol};" |'''Location: ${values.location}'''
`;
  const dialogueRender =
    `|-
|[[File:FILENAME|x200px|link=|center]]
|
`;
  const cgRender =
    `|-
! colspan="2" style="text-align:center;" |[[File:FILENAME|center|660px]]
`;
  const heading =
    `|-
! colspan="2" style="text-align:center;background-color:${values.locationCol}; color:${values.textCol};" |'''HEADING'''
`
  const footer =
    `|-
! colspan="2" style="text-align:center;background-color:${values.bottomCol};color:${values.textCol};" |'''Translation: [${values.translator}] '''
|}`;

  function alertOnce() {
    let counter = 0;
    return function () {
      if (counter < 1) {
        const alertMsg =
          `The formatter detected a TL marker in the dialogue but no chapter title in the TL Notes section.
Make sure the first line in the TL Notes section is a chapter title.
If this is an error, please contact Midori.`
        alert(alertMsg)
        counter++;
      }
    }
  }

  const alertNoTitleOnce = alertOnce(); //otherwise user will get multiple alerts for same error

  let inputDom = convertToDom(editor1.getData());
  extractBr(inputDom);

  let input = inputDom.querySelectorAll('p');
  let output = header;

  let currentName = ''; //needed for case where dialogue has name on every line
  const invalidLabel = [];
  let tlMarkerCount = 0;
  //console.log('INPUT', input);
  for (let i = 0; i < input.length; i++) {
    let line = input[i].innerText; //ignore possible text styles but keep DOM elements intact to add back dialogue styling
    //console.log('PROCESSING LINE', input[i].innerHTML);
    if (line.replace(/&nbsp;/g, '').trim() != '') { //ignore empty lines
      if (isFileName(line)) {
        //console.log('isFileName: true...');
        if (i === 0) { //if first line --> header file
          //console.log('headerfile');
          output = output.replace("HEADERFILE", line.trim());
        }
        else { //if CG or scene change image file
          //console.log('image file');
          let cgCode = cgRender;
          output += cgCode.replace("FILENAME", line.trim());
          currentName = ''; //since its new section
        }
      }
      else { //if dialogue line or header
        input[i].innerHTML = formatTlMarker(input[i].innerHTML, alertNoTitleOnce);
        tlMarkerCount += countTlMarkers(line);
        let firstWord = line.split(" ")[0];
        if (!firstWord.includes(":")) { //if no colon --> continuing dialogue line
          //console.log('no colon, continue dialogue');
          output += formatStyling(input[i]).innerHTML + "\n\n"; //convert styling to source wiki notation
        }
        else {
          //console.log('has colon...');
          let label = firstWord.replace(':', ''); //remove colon
          if (label.toUpperCase() === 'HEADING') { //if heading
            //console.log('new HEADING');
            let headingCode = heading;
            output += headingCode.replace("HEADING", line.slice(line.indexOf(':') + 1).trim());
            currentName = ''; //since its new section
          }
          else if (namesLink[label.toUpperCase()] != undefined) { //if valid character is speaking
            //console.log('character speaking... ' + firstWord);
            if (label !== currentName) { //if new character is speaking
              //console.log('new character detected')
              let renderCode = dialogueRender;
              let id = "#" + label[0].toUpperCase() + label.slice(1, label.length); //create id to access chara's render file in Renders tab
              output += renderCode.replace("FILENAME", document.querySelector(id).value.trim());
              //update currentName
              currentName = label;
            }
            //input[i].childNodes[0] might be an element or a text node so use textContent instead of innerHTML or innerText
            let contents = input[i].childNodes[0].textContent;
            //console.log('CONTENTS OF FIRST CHILDNODE:', contents);
            contents = contents.replace(firstWord, '').trim(); //get HTMLString of <p> first ChildNode and remove label
            if (contents.length === 0) { input[i].childNodes[0].remove(); } //if first ChildNode was just the label then remove node
            else {
              input[i].childNodes[0].textContent = contents;
            } //set ChildNode HTML
            let newLine = formatStyling(input[i]);
            //console.log('AFTER STYLING', newLine)
            output += newLine.innerHTML.trim() + "\n\n";
          }
          else {
            invalidLabel.push(label);
          }
        }
      }
    }
  }

  if (tlMarkerCount > 0) { output += formatTlNotes(editor2.getData(), tlMarkerCount, alertNoTitleOnce); }
  output += footer;
  document.querySelector('#output').value = output;
  if (invalidLabel.length > 0) {
    //Formatter was unable to process these names:
    // 1. truncate after certain length
    let alertMsg = 'Formatter was unable to process these names:';
    for (let i = 0; i < invalidLabel.length; i++) {
      alertMsg += `\n${i + 1}. ${invalidLabel[i].slice(0, 200)}`
      if (invalidLabel[i].length > 200) { alertMsg += '...' }
      alertMsg += '\n\nDialogue lines should be labeled with character names or "Heading" for scene changes/headings.'
      alertMsg += '\nIf this is a problem other than a typo, please contact Midori.'
    }
    alert(alertMsg);
  }
}

//helper function for convertText
function getValues() {
  const values = {}
  values.location = document.querySelector('#location').value.trim();
  const select = document.querySelector('#author');
  values.author = select.options[select.selectedIndex].text;
  values.translator = document.querySelector('#translator').value.trim();
  values.tlLink = document.querySelector('#tlLink').value.trim();
  if (values.tlLink === '') { //if TL credit is to a wiki user
    values.translator = `[User:${values.translator}|${values.translator}]`;
  }
  else { //if TL credit is to an external wiki user
    values.translator = `${values.tlLink} ${values.translator}`;
  }
  values.writerCol = '#' + document.querySelector('input[name=writerCol]').value;
  values.locationCol = '#' + document.querySelector("input[name=locationCol]").value;
  values.bottomCol = '#' + document.querySelector('input[name=bottomCol]').value;
  values.textCol = '#' + document.querySelector('input[name=textCol]').value;
  return values;
}

//helper function to check if the line is a file
//params: line - a String
//returns a boolean value representing if the string is a file name
function isFileName(line) {
  const extensions = ['.png', '.gif', '.jpg', '.jpeg', '.ico', '.pdf', '.svg'];
  for (let i = 0; i < extensions.length; i++) {
    if (line.toLowerCase().endsWith(extensions[i])) {
      return true;
    }
  }
  return false;
}

//helper function to format bold, italics, links based on HTML tags
//params: editorDom - editor data already converted to DOM object
//returns a DOM object with specified HTML tags converted to wiki code equivalent
function formatStyling(editorDom) {
  editorDom.querySelectorAll('strong').forEach(function (strong) {
    strong.replaceWith(`'''${strong.innerText}'''`);
  });
  editorDom.querySelectorAll('i').forEach(function (italic) {
    italic.replaceWith(`''${italic.innerText}''`);
  });
  editorDom.querySelectorAll('a').forEach(function (link) {
    link.replaceWith(`[${link.href} ${link.innerText}]`);
  });
  return editorDom;
}

function countTlMarkers(line) {
  return line.match(/\[\d+\]/g) ? line.match(/\[\d+\]/g).length : 0;
}

//helper function to format tl note markers
function formatTlMarker(line, error) {
  if (line.search(/\[\d+\]/) > 0) { //if there is a tlMarker
    let title = getChapTitle(convertToDom(editor2.getData()), error);
    if (title) {
      let tlCode = `<span id='${title}RefNUM'>[[#${title}NoteNUM|<sup>[NUM]</sup>]]</span>`;
      const markers = line.match(/\[\d+\]/g);
      markers.forEach(function (marker) {
        let num = marker.substring(marker.indexOf('[') + 1, marker.indexOf(']'));
        let newTlCode = tlCode.replace(/NUM/g, num);
        line = line.replace(marker, newTlCode)
      });
    }
  }
  return line;
}

//TL Notes tab is supposed to contain an <ol> but when TLers paste in content it usually just becomes <p>
//Users don't always read instructions so need to account for user input wow i love UX design
//Editor already contains 1 <p> with the default text "If this is your first time using the formatter..."
//If there are TL Notes, there would be
//  1. A second <p> starting with a number
//  2. One <p> and one <ol> if notes are in numbered list
//Chapter title is first ChildNode of the editor DOM if child is <p> and innerText doesn't match default text or start with a number
//Detect if user forgot chapter title and alert user
//Get TL Notes which are the rest of the <p> elements or <li> elements
//If <p> elements start with number, then new TL note
//If not, then multi-paragraph TL note and add <p> content to current TL note
//Only gets called if there are TL markers in the dialogue
function formatTlNotes(data, count, error) {
  let inputDom = convertToDom(data);
  let title = getChapTitle(inputDom, error); //ERROR: only do this if there are tl notes available
  if (title) {
    inputDom.body.firstChild.remove(); //take out title
    extractBr(inputDom);
    let notes = [];
    if (inputDom.body.firstChild) { //if there is still more text
      //ERROR: this doesn't account for possible bolded numbers
      formatStyling(inputDom);
      //console.log('TL NOTES', inputDom)
      if (inputDom.body.firstChild.tagName.toUpperCase() === 'OL') { //if TL notes are in <li> 
        let listItems = Array.from(inputDom.querySelectorAll('li'));
        //console.log('TL NOTES li', listItems);
        listItems = listItems.map((item) => item.textContent.replace(/&nbsp;/g, '').trim());
        listItemsFiltered = listItems.filter((item) => item.trim().length > 0); //filter out empty lines
        notes = listItemsFiltered;
      } else { //if TL notes are in <p>  
        let paras = Array.from(inputDom.querySelectorAll('p'));
        paras = paras.map((item) => {
          //ERROR: doesn't account for multi-paragraph notes
          if (!isNaN(item.textContent[0])) { //ERROR: assumes the number is separated by space as in "1. note" vs. "1.note"
            return item.textContent.split(' ').slice(1).join(' ').replace(/&nbsp;/g, '').trim()
          }
          return item.textContent;
        });
        //console.log('TL NOTES p', paras);
        parasFiltered = paras.filter((para) => para.trim().length ? true : false); //filter out empty lines
        notes = parasFiltered;
      }
      if (notes.length === count) {
        let output =
          `|-
| colspan="2"|`;
        let tlCode = `<span id='${title}NoteNUM'>NUM.[[#${title}RefNUM|↑]] TEXT</span><br />`;
        for (let i = 0; i < notes.length; i++) {
          let newTlCode = tlCode.replace(/NUM/g, i + 1);
          output += newTlCode.replace('TEXT', notes[i]);
        }
        output = output.replace(/<br \/>$/m, "\n");
        return output;
      } else { alert('The formatter detected an unequal number of TL markers and TL notes.') }
    } else { alert('The formatter detected a TL marker in the dialogue but no TL Notes in the tab.') }
  }
  return ''
}

//helper function to get and format chapter title from tl notes
function getChapTitle(inputDom, error) {
  let firstElt = inputDom.body.firstChild;
  if (firstElt.tagName === 'P'
    && firstElt.innerText.indexOf('If this is your first time using the formatter') < 0
    && isNaN(firstElt.innerText[0])) {
    const title = firstElt.innerText.replace(/ /g, '');
    return title;
  }
  else {
    error();
  }
}
