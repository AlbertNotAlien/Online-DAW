# ![logo]() Online DAW

An online co-editing digital audio workstation (DAW) to create music programs that run in a browser.

> See the [demo](https://online-3j64gaf5l-albertnotalien.vercel.app/) here.
>
> Test Account:
> | email | password |
> | -------------- | -------- |
> | demo@gmail.com | demo123 |

---

## Techniques

- Used `Next.js`, `TypeScript`, and `Styled-components` to develop website.
- Used Tone.js to `play audio and midi tracks` and used wavesurfer.js to `generate waveform shape`.
- Played multiple audio and midi tracks `synchronously` and managed the mute, volume, and pan of each track individually in array.
- Used Web-Audio-API to complete `recording` and `exporting` audio files.
- Utilized Google Cloud SDK for uploading audio files to Firebase Storage while resolving CORS issues.
- Managed drag event of clips and midi notes to `change the position, start-time, length and pitch` by using React-Draggable.
- Managed global states with `Recoil`, including managed project configuration data and individual tracks data.
- Used `immer` to work with immutable nested state, including notes data managed on the piano roll.
- Used Firebase Firestore database to manage data and get `real-time updates` for collaborative editing.
- Linted code by ESLint plugin (eslint-plugin-import).

## Packages

- next
- react
- styled-components
- immer
- recoil
- uuid
- react-draggable
- react-copy-to-clipboard
- react-tooltip
- tone
- wavesurfer.js

## Features

### Create new project

Input the project name and bpm of the project to create a new project.

### Playback control

Play/pause synchronized for all audio and midi tracks by clicking on the play/pause buttons.

### Record audio

Record the audio on a new track by clicking the record button.

### BPM and metronome

Edit the project bpm and the active/inactive metronome.

### Track controls

Modify the mute, volume and pan for individual tracks.

### Edit clip's start-time

Drag and drop the clip position to change the clip start time.

### Edit notes

///  
Add, delete and modify the start time and duration of notes on the piano roll during the selected midi track.

### Co-Edit project

///  
Co-edit with partners, get real-time updates and prevent errors with the locking mechanism.

### Export mp3 file

Export mp3 file by recording all mixed tracks.

![Demo Video]()
