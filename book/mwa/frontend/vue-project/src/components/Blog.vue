<template>
  <div class="blog">
    <lightbox
      v-bind:src="lightboxPic"
      v-bind:title="lightboxPicTitle"
      v-on:hide-lightbox="lightboxActive = false"
      v-bind:active="lightboxActive"
    ></lightbox>
    <div class="blogBody">
      <DropZone
        id="dzone"
        :url="`${config?.service?.apiBaseUrl}/entry`"
        @sending="sending"
        :maxFileSize="600000000"
      />
      <calendar v-bind:entries="entries"></calendar>
      <div v-if="entries.length > 0">
        <blog-entry
          v-for="entry in entries"
          v-bind:key="entry._id"
          v-bind="entry"
          v-on:pic-clicked="picClicked"
          v-on:delete-entry="delEntry"
        ></blog-entry>
      </div>
      <div v-else>
        <p>Keine Einträge vorhanden.</p>
      </div>
    </div>
  </div>
</template>
<script>
import DropZone from 'dropzone-vue'
import BlogEntry from '@/components/BlogEntry.vue'
import Lightbox from '@/components/Lightbox.vue'
import Calendar from '@/components/Calendar.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import request from '../util/request'
import 'dropzone-vue/dist/dropzone-vue.common.css'
import config from '../../config'
import { openDialog } from 'vue3-promise-dialog'

export default {
  name: 'DiaryBlog',
  created() {
    console.log('CEATED blog: ', config)
    if (this.user) {
      request.get('/viewblog/' + this.user).then((json) => {
        this.$store.commit('setEntries', json)
      })
    } else {
      request
        .get('/entries')
        .then((json) => {
          if (json.length) {
            this.$store.commit('setEntries', json)
          }
        })
        .catch((err) => {
          console.log('Err: ', err)
          this.$router.push('/login')
        })
    }
  },
  data() {
    const vm = this
    return {
      config: config,
      user: this.$route.params.user,
      sending(files, xhr) {
        function callback(e) {
          const jsonId = JSON.parse(e)
          if (jsonId._id) {
            vm.addEntry(jsonId._id)
          }
        }

        xhr.onreadystatechange = () => {
          if (xhr.readyState === 4) {
            callback(xhr.response)
          }
        }
      },
      lightboxPic: '',
      lightboxPicTitle: '',
      lightboxActive: false,
    }
  },
  methods: {
    delEntry: function (id) {
      openDialog(ConfirmDialog, { text: 'Wirklich löschen?' })
        .then(() => {
          request.delete('/entry/' + id).then(() => {
            this.$store.commit('delEntry', id)
          })
        })
        .catch(() => {
          console.log('cancel pressed')
        })
    },
    addEntry: function (id) {
      console.log('add entry to list: ', id)
      request.get('/entry/' + id).then((json) => {
        json.startedit = true
        this.entries.unshift(json)
        this.entries.sort((a, b) => {
          return a.date < b.date
        })
        this.$router.push('/blog#_' + json._id)
        // window.location.hash = '#_' + json._id
      })
    },
    picClicked: function (id, title) {
      this.lightboxPic = config.service.apiBaseUrl + '/viewimage/' + id
      this.lightboxPicTitle = title
      this.lightboxActive = true
    },
  },
  computed: {
    entries() {
      return this.$store.state.entries
    },
  },
  components: {
    Calendar,
    DropZone,
    BlogEntry,
    Lightbox,
  },
}
</script>
<style>
#picupload {
  width: 90%;
  background: gray;
  min-height: 200px;
}

label {
  display: block;
  text-align: left;
  font-weight: bold;
}

textarea {
  width: 100%;
  box-sizing: border-box;
}

.blogBody {
  max-width: 90%;
  margin: auto;
}

.dropzone .dropzone__message {
  margin: 0.5em 0;
}

.dropzone {
  border-radius: 0.5em;
  border: 3px dashed gray;
  min-height: 50px;
}
</style>
