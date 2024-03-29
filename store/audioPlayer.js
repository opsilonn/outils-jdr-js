// Imports
import { Howl } from "howler";
const INDEX_OF_CATEGORY_NAME = 2;

const state = () => ({
  audioCategories: [
    {
      id: 1,
      title: "Ambiance",
      icon: "mdi-city-variant-outline",
      audio: {},
      howl: undefined,
      isPlaying: false,
      isLooping: false,
      hasError: false,
      volume: 0.75,
    },
    {
      id: 2,
      title: "Musique",
      icon: "mdi-music-note",
      audio: {},
      howl: undefined,
      isPlaying: false,
      isLooping: false,
      hasError: false,
      volume: 0.75,
    },
    {
      id: 3,
      title: "SFX",
      icon: "mdi-ear-hearing",
      audio: {},
      howl: undefined,
      isPlaying: false,
      isLooping: false,
      hasError: false,
      volume: 0.75,
    },
  ],
});

const getters = {};

const mutations = {
  /** */
  setAudio(state, audio) {
    // We get the category's index
    const category = state.audioCategories.find((tab) => audio.path.split("/")[INDEX_OF_CATEGORY_NAME].includes(tab.title));

    // If not found : ERROR
    if (!category) {
      alert("Music not found !");
      return;
    }

    // If an audio was already loaded : stop it
    if (!!category.howl) {
      category.howl.pause();
    }

    // We set some values
    category.audio = audio;
    category.isPlaying = true;
    category.howl = new Howl({
      src: [audio.path],
      loop: category.isLooping,
      volume: category.volume,
    });

    // We play the audio file
    category.howl.play();
    category.hasError = false;

    // When it ends, and if loop is disabled : disable the play flag
    category.howl.on("end", () => {
      if (!category.isLooping) {
        category.isPlaying = false;
      }
    });

    // If it fails to load
    category.howl.on("loaderror", () => {
      category.isPlaying = false;
      category.howl = null;
      category.hasError = true;
      alert(`Piste audio non trouvée\n - nom : ${audio.name}\n - chemin : ${audio.path}`);
    });
  },

  /**
   * Sets the volume of a specific category
   * @param {int} id identifier of the category to update
   */
  setVolume(state, id) {
    // We get the category
    const category = state.audioCategories.find((_) => _.id === id);

    // If a file, is loaded, we set the volume accordingly
    if (!!category?.howl) {
      category.howl.volume(category.volume);
    }
  },

  /**
   * Either plays or pauses the track of a specific category
   * @param {int} id identifier of the category to update
   */
  setPlayOrPause(state, id) {
    // We get the category
    const category = state.audioCategories.find((_) => _.id === id);

    // If a file, is loaded, we play or pause it accordingly
    if (!!category?.howl) {
      category.isPlaying = !category.isPlaying;
      if (category.isPlaying) {
        category.howl.play();
      } else {
        category.howl.pause();
      }
    }
  },

  /**
   * Either enables or disables the loop of a specific category
   * @param {int} id identifier of the category to update
   */
  setLoop(state, id) {
    // We get the category
    const category = state.audioCategories.find((_) => _.id === id);

    category.isLooping = !category.isLooping;

    // If a file, is loaded, we (dis)enable the loop it accordingly
    if (!!category?.howl) {
      category.howl.loop(category.isLooping);
    }
  },

  /** Stops all tracks that are being played */
  stopAllAudioTracks(state) {
    state.audioCategories.forEach((category) => {
      if (!!category?.howl) {
        tab.howl.pause();
      }
    });
  },
};

const actions = {};

export default {
  state,
  getters,
  mutations,
  actions,
};
