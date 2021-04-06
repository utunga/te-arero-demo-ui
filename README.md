# VUE UI 

> Voice activity detection based pronunciation feedback


## Build Setup

``` bash
# install dependencies
npm install

# serve with hot reload at localhost:8080
npm run dev

# build for production with minification
npm run build

# build for production and view the bundle analyzer report
npm run build --report
```

For a detailed explanation on how things work, check out the [guide](http://vuejs-templates.github.io/webpack/) and [docs for vue-loader](http://vuejs.github.io/vue-loader).

## API Setup
You need to create a file `api_auth.js` which contains the following,

```js
api_auth = {
  headers:{
    Authorization: "Token YOUR_TOKEN_HERE",
  },
  url: 'https://koreromaori.io/api/transcription/?method=stream'
}

exports.api_auth = api_auth
```


## Ngā Mihi
This demo uses code from https://github.com/kdavis-mozilla/vad.js and https://github.com/grishkovelli/vue-audio-recorder. I couldn't import them directly as I needed to modify the code a bit to suit this demo.