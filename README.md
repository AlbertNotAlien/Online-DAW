# <img width="26" alt="Online DAW" src="https://user-images.githubusercontent.com/101801880/208061380-6d3ae7be-8344-44bb-b7dd-12aab72af393.svg"> Online DAW

An online co-editing **digital audio workstation (DAW)** to create music programs that run in a browser.`

See the **[demo](https://online-daw.vercel.app/)** here.

> Demo Account:
> | email | password |
> | -------------- | -------- |
> | demo@gmail.com | demo123 |

## Packages

- [typescript][typescript]
- [next.js][next.js]
- [react.js][react.js]
- [styled-components][styled-components]
- [immer][immer]
- [recoil][recoil]
- [uuid][uuid]
- [react-draggable][react-draggable]
- [react-copy-to-clipboard][react-copy-to-clipboard]
- [react-tooltip][react-tooltip]
- [tone.js][tone.js]
- [wavesurfer.js][wavesurfer.js]
- [eslint][eslint]
- [firebase][firebase]

## Features

### Create new project

Input the project name and bpm of the project to create a new project.

![Create new project](https://imgur.com/D4A4iE1)

### Control playback and Record audio

Play/pause synchronized for all audio and midi tracks by clicking on the play/pause buttons. Record the audio on a new track by clicking the record button.

### Track controls

Modify the mute, volume and pan for individual tracks. Drag and drop the clip position to change the clip start time.

### Edit notes

Add, delete and modify the start time and duration of notes on the piano roll during the selected midi track.

### Co-Edit project

Co-edit with partners, get real-time updates and prevent errors with the locking mechanism.

### Export mp3 file

Export mp3 file by recording all mixed tracks.

## Techniques

- Used [Next.js][next.js], [TypeScript][typescript], and [Styled-components][styled-components] to develop website.
- Used [Tone.js][tone.js] to play audio and midi tracks and used [wavesurfer.js][wavesurfer.js] to generate waveform shape.
- Played multiple audio and midi tracks synchronously and managed the mute, volume, and pan of each track individually in array.
- Used [Web-Audio-API][web-audio-api] to complete recording and exporting audio files.
- Utilized [Google Cloud SDK][google-cloud-sdk] for uploading audio files to [Firebase Storage][firebase-storage] while resolving CORS issues.
- Managed drag event of clips and midi notes to change the position, start-time, length and pitch by using [React-Draggable][react-draggable].
- Managed global states with [Recoil][recoil], including managed project configuration data and individual tracks data.
- Used [immer][immer] to work with immutable nested state, including notes data managed on the piano roll.
- Used [Firebase Firestore][firebase-firestore] database to manage data and get real-time updates for collaborative editing.
- Linted code by [ESLint][eslint] plugin ([eslint-plugin-import][eslint-plugin-import]).

## Function Map

<img width="1215" alt="Online DAW" src="https://user-images.githubusercontent.com/101801880/208061476-4191d580-5873-486f-84f1-5ff4f01627a0.png">

## Demo Video

See the **[demo video](https://drive.google.com/file/d/1hET26_-dKTYHH8to3_Te5nCQP39h2OMR/view?usp=share_link)** here.

[typescript]: https://github.com/microsoft/TypeScript
[next.js]: https://github.com/vercel/next.js/
[react.js]: https://github.com/facebook/react
[styled-components]: https://github.com/styled-components/styled-components
[immer]: https://github.com/immerjs/immer
[recoil]: https://github.com/facebookexperimental/Recoil
[uuid]: https://github.com/uuidjs/uuid
[react-draggable]: https://github.com/react-grid-layout/react-draggable
[react-copy-to-clipboard]: https://github.com/nkbt/react-copy-to-clipboard
[react-tooltip]: https://github.com/ReactTooltip/react-tooltip
[tone.js]: https://github.com/Tonejs/Tone.js
[wavesurfer.js]: https://github.com/katspaugh/wavesurfer.js
[eslint]: https://github.com/eslint/eslint
[eslint-plugin-import]: https://www.npmjs.com/package/eslint-plugin-import
[web-audio-api]: https://github.com/WebAudio/web-audio-api
[google-cloud-sdk]: https://cloud.google.com/sdk/docs/install
[firebase]: https://firebase.google.com/
[firebase-storage]: https://firebase.google.com/products/storage
[firebase-firestore]: https://firebase.google.com/products/firestore
