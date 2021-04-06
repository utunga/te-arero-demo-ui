<template>
  <div class="Korero">
    <div class="header">
      <button id="startVAD" v-bind:class="{ vad: vadOn, on: recordingOn, 'loading': loadRecording}">
        <i class="fa fa-microphone" ></i>
        <i class="fa fa-stop" ></i>
        <i class="fa fa-spinner fa-spin"></i>
      </button>
      <div id="vadContainer">
        <div id="vadStatus" v-bind:class="{ active: vadOn, 'mobile': isMobile()}">
          <div>
            <canvas id="canvas" v-if="!isMobile()"></canvas>
            <span v-if="isMobile() && vadOn && recordingOn">Voice Detected</span>
            <span v-if="isMobile() && recordingOn && !vadOn">Listening</span>
            <span v-if="isMobile()">Hit Record</span>
          </div>
        </div>
      </div>
      <div class="targetSelectDivContainer">
        <div class="targetSelectDiv">

          <label for="targetSentence">Target Sentence</label>
          <v-select taggable id="targetSentence" :options="phrases" v-model="targetSentence"></v-select>
        </div>
      </div>
      <div class="targetSelectDivContainer">
        <div class="targetSelectDiv">

          <label for="alphabetSelect">Alphabet</label>
          <v-select taggable id="alphabetSelect" :options="alphabets" v-model="alphabet"></v-select>
        </div>
      </div>
    </div>
    <div id="modelStatus">
        {{model_version}}
    </div>
    <div class="body">
      <div id="transcriptions_wrapper">
        <div id="transcriptions" ref="transcriptions">
          <transcription
            v-for="(item, index) in transcriptions"
            :key="index"
            :variant="item.variant"
            :targetSentence="item.target_sentence"
            :recording="item.recording"
            :showAudio="(item.show_audio)"
            :index="index"
          ></transcription>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import recorder from '../lib/recorder.js'
const axios = require('axios');
const yaml = require('js-yaml');
const fs   = require('fs');

export default {
  name: 'Kōrero',
  data () {
    return {
      vadOn: false,
      recordingOn: false,
      clearLast: false,
      recorder: null,
      buttonText: 'Start',
      transcriptions: [],
      icon: 'fa-microphone',
      model_version: '',
      targetSentence: '',
      alphabet: 'default',
      loadRecording: false,
      phrases: [],
      alphabets: []
    }
  },
  methods: {  
    isMobile() {
      if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Mobile|SamsungBrowser|Opera Mini/i.test(navigator.userAgent)) {
        console.log(navigator.userAgent)
        return true
      } else {
        return false
      }
    },
    stopRecording()  {
      console.log("stop recording");
      try{this.recorder.stop();}
      catch(e){

        console.log("stop recording err");
      }
      this.recorder=null;
      this.vadOn = false;
      this.recordingOn = false
    }
  },
  mounted: function () {

    this.$root.$on('stopRecording', this.stopRecording);

    axios.get("/static/options.yml").then((doc) =>
    {
      this.phrases = yaml.safeLoad(doc.data).phrases;
      this.alphabets = yaml.safeLoad(doc.data).alphabets;
      this.alphabets.splice(1, 0, "all")
    });

    startVAD.onclick = event => {

      if (this.recorder==null){
        this.loadRecording = true;
        this.recorder = new recorder({
          putRecording : (record) => {
            const variant = this.alphabet;
            const target_sentence = this.targetSentence;
            const variants = []
            if (variant === 'all') {
              for (var i in this.alphabets) {
                if (this.alphabets[i] != 'all') {
                  variants.push(this.alphabets[i]);
                }
              }
            }
            else {
              variants.push(variant)
            }

            //only show audio once per list
            var show_audio = true;
            for (var j in variants) {
              var transcription = {
                target_sentence: target_sentence,
                recording: record,
                variant: variants[j],
                show_audio: show_audio
              }
              show_audio=false;
              // each Transcription component requests
              // feedback from the server when 'mounted' 
              this.transcriptions.push(transcription);

              // this.$nextTick(() => {
              //   this.$refs.transcriptions.scrollTop = this.$refs.transcriptions.scrollHeight;
              // });
            }
          },
          afterRecording  : (stream) =>{
            this.buttonText = 'Start'            
            this.recorder=null;
          },
          pauseRecording  : () => {console.log('paused')},
          micFailed       : () => {console.log('failed')},
          voiceStop: () => {
            this.vadOn = false
          },
          voiceStart: () => {
            this.vadOn = true
          },
          canvasID: this.isMobile() ? null : 'canvas',
          bitRate         : 64,
          sampleRate      : 44100,
          // format          : this.format
        })
      }

      if (this.recordingOn){
        this.recorder.put();
        //his.recorder.stop();
        this.recorder=null;
        this.vadOn = false;
        this.recordingOn = false
        // this.buttonText = 'Start'
      } else {
        this.recorder.start()
        this.recordingOn = true
        this.buttonText = 'Stop'
        this.loadRecording = false
      }
    }
  }
}
</script>

<style>

.Korero {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  font-size: 14px;
}
button.delete{
  position: absolute;
  right: 0px;
  top: 0px;
  display: block;
  border: 0px;
  margin: 2px;
  font-size: 0.7em;
  color: #696969;
  cursor: pointer;
  outline: none;
  background: none;
}

.Korero, .header, .body{
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.body{
  height: 100vh;
  margin-top: -225px;
}
.header{
  padding-bottom: 15px;
  z-index: 1;
  background-color: white;
  padding-left: 15px;
  padding-right: 15px;  
}

#transcriptions_wrapper {
  display: flex;
  flex-direction: column;
  overflow-y: scroll;
  margin-top: 232px;
  height: 100vh;
}

#transcriptions {
  z-index: 0;
  display: flex;
  flex-direction: column-reverse;
  flex-wrap: nowrap;
  align-items: center;  
  padding-left: 15px;
  padding-right: 15px;
  flex-wrap: nowrap;
  -webkit-overflow-scrolling: touch;
  -ms-overflow-style: -ms-autohiding-scrollbar;
}

#vadContainer {
  display:flex;
  flex-direction: row;
  align-self: center;
}
.targetSelectDivContainer {
  display:flex;
  flex-direction: row;
  align-self: center;
}
.targetSelectDiv label {
  text-align: left;
  display:block;
}
.targetSelectDiv{
  font-size: 1.2em;
  width: 360px;
  padding:20px;
}
@media (max-width: 480px) {
  .targetSelectDiv{
    font-size: 1em;
    width: 360px;
    padding: 10px;
  }
}
#vadStatus{
  display: flex;
  max-width: 500px;  
  height: 100px;
  align-items: center;
}
#vadStatus canvas{
  z-index: 1;
  display: block;
  height: 100%;
  width: 100%;
  background-color: #333;
}
#vadStatus div{
  height: 100%;
  width: 100%;
  border: 4px solid black;
  border-radius: 4px;
}
#vadStatus.active div{
  border-color: red;
}
#vadStatus.mobile{
  height: 28px;
  max-width: 150px;  
}
#vadStatus.mobile div span{
  display: block;
  padding: 4px;
}
#vadStatus.mobile div{
  color: white;
  font-weight: 700;
  background-color: black;
}
#vadStatus.mobile.active div{
  background-color: red;
}
#startVAD {
  z-index: 2;
  align-self: center;
  margin: 15px;
  outline: none;
  background-color: rgb(40,40,40);
  color: white;
  width: 80px;
  height: 80px;
  border: 2px solid black;
  border-radius: 40px;
  padding: 8px 16px;
  cursor: pointer;
}
#startVAD [class*=fa]{
  font-size: 34px !important;
}
#startVAD.on {
  background-color: rgba(255, 40, 40, 0.75);
  border-color: rgb(200, 40, 40);
}
#startVAD.on.vad {
  background-color: rgba(255, 40, 40, 1);
}
#startVAD.on .fa-microphone{
  display: none;
}
#startVAD .fa-stop, #startVAD .fa-spinner{
  display: none;
}
#startVAD.on .fa-stop{
  display: initial;
}
#startVAD.on.loading .fa-spinner{
  display: initial;
}

</style>
