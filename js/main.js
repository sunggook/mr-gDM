/*
*  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
*
*  Use of this source code is governed by a BSD-style license
*  that can be found in the LICENSE file in the root of the source
*  tree.
*/

// This code is adapted from
// https://rawgit.com/Miguelao/demos/master/mediarecorder.html

'use strict';

/* globals MediaRecorder */

let mediaRecorder;
let recordedBlobs;
let selectedMimeType;

const codecPreferences = document.querySelector('#codecPreferences');

const errorMsgElement = document.querySelector('span#errorMsg');
const recordedVideo = document.querySelector('video#recorded');
const recordButton = document.querySelector('button#record');
recordButton.addEventListener('click', () => {
  if (recordButton.textContent === 'Start Recording') {
    startRecording();
    requestDataButton.disabled = false;
    pauseButton.disabled = false;
    pauseTrackButton.disabled = false;
  } else {
    stopRecording();
    recordButton.textContent = 'Start Recording';
    playButton.disabled = false;
    downloadButton.disabled = false;
    codecPreferences.disabled = false;

    requestDataButton.disabled = true;
    pauseButton.disabled = true;
    pauseTrackButton.disabled = true;
    resumeTrackButton.disabled = true;
  }
});

const playButton = document.querySelector('button#play');
playButton.addEventListener('click', () => {
  // const mimeType = codecPreferences.options[codecPreferences.selectedIndex].value.split(';', 1)[0];
  const mimeType = codecPreferences.options[codecPreferences.selectedIndex].value;
  const superBuffer = new Blob(recordedBlobs, {type: mimeType});
  recordedVideo.src = null;
  recordedVideo.srcObject = null;
  recordedVideo.src = window.URL.createObjectURL(superBuffer);
  recordedVideo.controls = true;
  recordedVideo.play();
});

const downloadButton = document.querySelector('button#download');
downloadButton.addEventListener('click', () => {
  let option = {
    type: 'video/webm'
  }

  let mp4File = selectedMimeType.includes('video/mp4');
  if (mp4File) {
    option = {
      type: 'video/mp4'
    }
  }
  const blob = new Blob(recordedBlobs, option);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  if (mp4File) {
    a.download = 'test.mp4';
  } else {
    a.download = 'test.webm';
  }

  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 100);
});

const requestDataButton = document.querySelector('button#requestData');
requestDataButton.addEventListener('click', () => {
  mediaRecorder.requestData();
});

const pauseButton = document.querySelector('button#pause');
pauseButton.addEventListener('click', () => {
  mediaRecorder.pause();

  pauseButton.disabled = true;
  resumeButton.disabled = false;
});

const resumeButton = document.querySelector('button#resume');
resumeButton.addEventListener('click', () => {
  mediaRecorder.resume();

  pauseButton.disabled = false;
  resumeButton.disabled = true;
});

const pauseTrackButton = document.querySelector('button#pauseTrack');
pauseTrackButton.addEventListener('click', () => {
  const tracks = window.stream.getTracks();
  tracks.forEach(track => track.enabled = false);

  pauseTrackButton.disabled = true;
  resumeTrackButton.disabled = false;
});

const resumeTrackButton = document.querySelector('button#resumeTrack');
resumeTrackButton.addEventListener('click', () => {
  const tracks = window.stream.getTracks();
  tracks.forEach(track => track.enabled = true);

  pauseTrackButton.disabled = false;
  resumeTrackButton.disabled = true;
});


function handleDataAvailable(event) {
  console.log('handleDataAvailable', event);
  if (event.data && event.data.size > 0) {
    recordedBlobs.push(event.data);
  }
}

function getSupportedMimeTypes() {
  const possibleTypes = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=avc1.620011,opus',
    'video/mp4;codecs=avc1,mp4a.40.2',
    'video/mp4;codecs=avc1,opus',
    'video/mp4;codecs=avc1.620011,opus',
    'video/mp4;codecs=avc1.620011',
    'video/mp4;codecs=vp9,mp4a.40.2',
    'video/mp4;codecs=vp9,opus',
    'video/mp4;codecs=vp9',
    'video/mp4;codecs=av01,opus',
    'video/mp4;codecs=av01,mp4a.40.2',
    'video/mp4',
    'audio/mp4;codecs=opus',
    'audio/mp4;codecs=mp4a.40.2',
    'audio/webm;codecs=opus',
  ];
  return possibleTypes.filter(mimeType => {
    return MediaRecorder.isTypeSupported(mimeType);
  });
}

function startRecording() {
  recordedBlobs = [];
  const mimeType = codecPreferences.options[codecPreferences.selectedIndex].value;
  const options = {mimeType};
  selectedMimeType = mimeType;

  try {
    mediaRecorder = new MediaRecorder(window.stream, options);
  } catch (e) {
    console.error('Exception while creating MediaRecorder:', e.message);
    errorMsgElement.innerHTML = `Exception while creating MediaRecorder: ${JSON.stringify(e)}`;
    return;
  }

  console.log('Created MediaRecorder', mediaRecorder, 'with options', options);
  recordButton.textContent = 'Stop Recording';
  playButton.disabled = true;
  downloadButton.disabled = true;
  // codecPreferences.disabled = true;
  mediaRecorder.onstop = (event) => {
    console.log('Recorder stopped: ', event);
    console.log('Recorded Blobs: ', recordedBlobs);
  };
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.start(200);
  console.log('MediaRecorder started', mediaRecorder);
}

function stopRecording() {
  mediaRecorder.stop();
}

function handleSuccess(stream) {
  recordButton.disabled = false;
  console.log('getDisplayMedia() got stream:', stream);
  window.stream = stream;

  const gumVideo = document.querySelector('video#gum');
  gumVideo.srcObject = stream;

  getSupportedMimeTypes().forEach(mimeType => {
    const option = document.createElement('option');
    option.value = mimeType;
    option.innerText = option.value;
    codecPreferences.appendChild(option);
  });
  codecPreferences.disabled = false;
}

async function init(constraints) {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia(constraints);
    // const stream = await navigator.mediaDevices.getDisplayMedia( {
        // audio: {
        //   sampleRate: 44100,
        // },
        // video: true});
    handleSuccess(stream);
  } catch (e) {
    console.error('navigator.getDisplayMedia error:', e);
    errorMsgElement.innerHTML = `navigator.getDisplayMedia error:${e.toString()}`;
  }
}

document.querySelector('button#start').addEventListener('click', async () => {
  document.querySelector('button#start').disabled = true;
  const hasEchoCancellation = document.querySelector('#echoCancellation').checked;
  const constraints = {
    video: true
  };
  console.log('Using media constraints:', constraints);
  await init(constraints);
});
