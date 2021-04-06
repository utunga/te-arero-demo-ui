import Vue from 'vue'
import Korero from '@/components/Korero'
import Transcription from '@/components/Transcription'
import vueCustomElement from 'vue-custom-element'
import VueSelect from 'vue-select'
import 'vue-select/dist/vue-select.css';

Vue.use(vueCustomElement)
Vue.component('v-select', VueSelect)
Vue.component('transcription', Transcription)
Vue.customElement('vue-widget', Korero)
