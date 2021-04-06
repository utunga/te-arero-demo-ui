<template>
 
<div class='transcription' v-bind:class="[status]" v-if=" status != 'Deleted'"> 

  <button class="delete" v-if="status != 'Transcribing'" v-on:click="markDeleted()"><i class="fa fa-times"></i></button>

  <div class="info_container variant">variant: <span class="info">{{variant}}</span></div>

  <div class="info_container model_version">model version: <span class="info">{{model_version}}</span></div>

  <div class='text'>
  
    <i class="fa fa-spinner fa-spin" v-bind:class="[status]" v-if="status == 'Transcribing'" ></i>

    <div v-if="lastError"class="lastError error">
      {{lastError}}
    </div>

    <div v-if="show_metadata">
      <div class='confidence'>
        <div class="character" v-for="character in metadata">
          <div class="char-wrapper" v-if="character.char==' '"
               :style="{backgroundColor: `rgb(255, 40, 40, 0)`}">
               <span class="char">&nbsp;&nbsp;</span>
               <br><span class="prob">&nbsp;{{character.prob.toFixed(2)}}&nbsp;</span>
          </div>
          <div class="char-wrapper" v-if="character.char!=' '"
               :style="{
                  backgroundColor: `rgba(255, 40, 40, ${1-character.prob})`
                }">
              <span class="char">{{character.char}}</span>
              <br><span class="prob">&nbsp;{{character.prob.toFixed(2)}}&nbsp;</span>
          </div>
        </div>
      </div>
      <div><br></div>
      <div class='confidence'>          
        <div class="word" v-for="word in words"
          :style="{
              backgroundColor: `rgba(255, 40, 40, ${1-word.prob})`
            }">
          <div class="word-wrapper" 
            >
              <span class="char" v-for="char in word.word" v-if="char != ' '">{{char}}</span>
              
          </div><span class="prob">{{word.prob.toFixed(2)}}</span>
        </div>
      </div>
    </div>
    <div v-else>
      <div v-if="status != 'Transcribing'">{{text}}</div>
    </div>
  </div>
  <div class="audio" v-if="showAudio">
    <audio v-if="audio_url" :src="audio_url" type="audio/mp3" controls v-on:play="stopRecording"></audio>
  </div>

</div>

</template>

<script>
const ApiAuth = require('../../api_auth')
const api_auth = ApiAuth.api_auth;
const axios = require('axios');

export default {
  name: 'Transcription',
  data () {
    return {
      status: "Transcribing",
      model_version: null,
      show_metadata: false,
      metadata: [],
      words: [],
      audio_url: null,
      text: null,
      lastError: null
    }
  },
  props: {
    variant: String,
    targetSentence: String,
    recording: Object,
    index: Number,
    showAudio: Boolean
  },
  methods: {
    markDeleted: function (e) {
      this.status = "Deleted"
    },
    stopRecording: function () {
      this.$root.$emit("stopRecording");
    },  
    p_not_word: function(n, probabilities){
      if (n == 0){
        return 0
      }                                                                
      else {
        return probabilities[n - 1] * this.p_not_word(n - 1, probabilities) + (1 - probabilities[n - 1])
      }
    },
    p_word: function(probabilities){
      return 1 - this.p_not_word(probabilities.length, probabilities)     
    },
    average: (array) => array.reduce((a, b) => a + b) / array.length
  },
  mounted: function () {

    //this.$el.scrollIntoView({ behavior: 'smooth' });
    var query_params = {
      variant: this.variant,
      target_sentence: this.targetSentence
    };

    this.lastError=null;

    var formData = new FormData();
    formData.enctype="multipart/form-data";
    formData.append('audio_file', this.recording.blob, 'audio_file.mp3') 
    var url = api_auth['pronunciation_url_variant']   
    axios.post(
      url,
      formData,
      {
        params: query_params,
        headers: api_auth['headers']
      })
    .then((response) => {

      this.text = response.data.target_sentence
      this.model_version = response.data.model_version
      this.show_metadata = false
      if (response.data.metadata) {
        this.show_metadata = true
        this.metadata = response.data.metadata

        var words = []
        var probs = []
        var word = ''
        var start = 0
        for (var i=0; i <response.data.metadata.length; i++){
          
          if (response.data.metadata[i].char != ' '){
            word = word + response.data.metadata[i].char
            probs.push(response.data.metadata[i].prob)
            continue
          } else {
            words.push({'word': word, 'prob': this.average(probs)})
            probs = []
            start = i
            word = ''
          }
        } 
        words.push({'word': word, 'prob': this.average(probs)})
        this.words = words;
      } 
      this.audio_url = this.recording.url
      this.status = 'Success'
      
    })
    .catch((error) => {
      this.status = 'Failed'
      console.log(error)
      this.lastError=error;
      
    })
      
  }
}
</script>


<style scoped>

.transcription {
  position: relative;
  width: 100%;
  margin: 20px 30px 20px 30px;
  max-width: 500px;
  /*margin-top: 20px; */
  font-size: 16px;
  border-radius: 8px;
  /*box-shadow: 0px 2px 6px -2px rgba(0,0,0,1)  */
  border: 1px solid black;
}

@media (max-width: 480px) {
  .transcription {
    margin: 10px 20px 10px 20px;
    max-width: 500px;
    font-size: 10px;
  }
}


.transcription.Transcribing{
  border: 0px;
}

.transcription .text {
  padding: 2.4em 1.3em 1em 1.3em;
}

.transcription:nth-of-type(1){
  margin-top: 40px;
}

div.transcription.Success div.text [class*=fa]{
  display: none;
}

div.confidence{
  display: inline-flex;
  flex-wrap: wrap;
}


div.word{
  margin-right: 1.2em;
}

div.word .char {
  width: 1.2em;
}

div.word-wrapper {
  padding: .4em 1.2em;
}

div.word:last-child{
  margin-right: 0px;
}

span.char {
  display: inline-block;
  text-align: center;
}

div.char-wrapper{
  padding: .4em 1.2em;
  display: inline-block;
  text-align: center;
}

span.prob{
  display: inline-block;
  font-size: 0.9em;
  padding: 0px;
  margin-top:-1em;
}

audio {
  outline: none;
  width: 100%;
  padding-bottom: 1.2em;
}

.audio{
  padding: 0 1.2em;
}

.info_container {
  font-size: .8em;
  padding: .2em .2em;
}

.info_container .info {
  font-weight: bold;
}

.info_container.variant {
  text-align: left;
  float: left;
  width: 35%;
  padding-left: 20px;
}

.info_container.model_version {
  text-align: right;
  float: right;
  width: 50%;
  padding-right: 35px;
}


@media (max-width: 480px) {
  .info_container{
    font-size: 0.9em;
  }
  .info_container.model_version {
    display:none;
  }
}

.lastError {
  color: red;
  font-size: .8em;
  padding: 20px
}


</style>
