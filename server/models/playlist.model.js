import fs from "fs";
import path from "path";
import { promisify } from "util";

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const pathFile = path.join(__dirname, "../data/playlists.json");

export default class Playlist {
  /** @type {Number} */
  id;
  /** @type {String} */
  name;
  /** @type {Object} */
  rootFolder;
  /** @type {Number} */
  total;

  /**
   * Constructor
   * @param {Playlist} newObj
   */
  constructor(newObj) {
    this.id = newObj.id;
    this.name = newObj.name;
    this.rootFolder = { folders: [], files: [] };
    this.total = newObj.total || 0;
  }

  /**
   * @param {Number} id
   * @returns {Promise<Playlist>}
   */
  static async get(id) {
    // Read the audio
    const playlists = await this.getAll();

    // Find the correct playlist
    const playlist = playlists.find((_) => _.id === id);

    // If the playlist was not found : throw error
    if (!playlist) {
      throw new Error("Playlist not found !");
    }

    return playlist;
  }

  /**
   * @returns {Promise<Playlist[]>}
   */
  static async getAll() {
    // Read the audio
    const playlists = await readFile(pathFile, "utf8");

    // Parse the audio as JSON
    return JSON.parse(playlists);
  }

  /**
   * @param {Playlist} playlistReceived
   * @returns {Promise<Playlist>}
   */
  static async add(playlistReceived) {
    // Get all the playlists
    let playlists = await this.getAll();

    // Create new Playlist
    const playlist = new Playlist({
      id:
        Math.max.apply(
          null,
          playlists.map((_) => _.id)
        ) + 1,
      name: playlistReceived.name,
    });

    // Add new Playlist
    playlists.push(playlist);
    writeFile(pathFile, JSON.stringify(playlists, null, 2), "utf8");

    return playlist;
  }

  /**
   *
   * @param {Number} id
   * @param {Playlist} playlistReceived
   * @returns {Promise<Playlist>}
   */
  static async update(id, playlistReceived) {
    // Get all the playlists
    let playlists = await this.getAll();

    // We get the wanted playlist
    const playlist = playlists.find((_) => _.id === id);

    // If not found : throw Error
    if (!playlist) {
      throw new Error("Playlist not found !");
    }

    // We only update the name
    playlist.name = playlistReceived.name;
    if (playlistReceived.rootFolder) {
      playlist.rootFolder = playlistReceived.rootFolder;
      playlist.total = playlistReceived.total;
    }
    writeFile(pathFile, JSON.stringify(playlists, null, 2), "utf8");

    return playlist;
  }

  /**
   * @param {Number} id
   */
  static async delete(id) {
    // Get all the playlists
    let playlists = await this.getAll();

    // get index of the playlist to remove
    const index = playlists.findIndex((_) => _.id === id);

    // invalid index : throw Error
    if (index <= -1) {
      throw new Error("Playlist not found !");
    }

    // Remove found Playlist
    playlists.splice(index, 1);

    // Re-write audio
    writeFile(pathFile, JSON.stringify(playlists, null, 2), "utf8");
  }

  /**
   *
   * @param {Number} idPlaylist
   * @param {Audio} audio
   * @param {String} path
   * @returns {Promise<Playlist>}
   */
  static async addAudio(idPlaylist, audio, path) {
    // Get all the playlists
    let playlists = await this.getAll();

    // We get the wanted playlist
    const playlist = playlists.find((_) => _.id === idPlaylist);

    // If not found : throw Error
    if (!playlist) {
      throw new Error("Playlist not found !");
    }

    // We fetch the folder in the arborescence
    let folder = {};
    try {
      folder = this.getSubfolder(playlist.rootFolder, path);
    } catch (err) {
      throw new Error("Invalid path !");
    }

    if (folder.files.some((file) => file.path === audio.path)) {
      throw new Error("Duplicate audio in folder !");
    }

    const newAudio = {
      id:
        Math.max.apply(
          null,
          folder.files.map((_) => _.id)
        ) + 1,
      name: audio.name,
      surname: "",
      path: audio.path,
    };
    playlist.total += 1;

    folder.files.push(newAudio);
    writeFile(pathFile, JSON.stringify(playlists, null, 2), "utf8");
    return playlist;
  }

  /**
   *
   * @param {Number} idPlaylist
   * @param {Number} idAudio
   * @param {Audio} audioReceived
   * @param {String} path
   * @returns {Promise<Playlist>}
   */
  static async updateAudio(idPlaylist, idAudio, audioReceived, path) {
    // Get all the playlists
    let playlists = await this.getAll();

    // We get the wanted playlist
    const playlist = playlists.find((_) => _.id === idPlaylist);

    // If not found : throw Error
    if (!playlist) {
      throw new Error("Playlist not found !");
    }

    // We fetch the folder in the arborescence
    let folder = {};
    try {
      folder = this.getSubfolder(playlist.rootFolder, path);
    } catch (err) {
      throw new Error("Invalid path !");
    }

    // We update the file
    const file = folder.files.find((f) => f.id === idAudio);
    file.surname = audioReceived.surname || "";

    writeFile(pathFile, JSON.stringify(playlists, null, 2), "utf8");
    return playlist;
  }

  /**
   * @param {Number} idPlaylist
   * @param {Number} idAudio
   * @param {String} path
   */
  static async deleteAudio(idPlaylist, idAudio, path) {
    // Get all the playlists
    let playlists = await this.getAll();

    // We get the wanted playlist
    const playlist = playlists.find((_) => _.id === idPlaylist);

    // If not found : throw Error
    if (!playlist) {
      throw new Error("Playlist not found !");
    }

    // We fetch the folder in the arborescences
    let folder = {};
    try {
      folder = this.getSubfolder(playlist.rootFolder, path);
    } catch (err) {
      throw new Error("Invalid path !");
    }

    // Remove file from Playlist
    const indexFile = folder.files.findIndex((file) => file.id === idAudio);
    folder.files.splice(indexFile, 1);
    playlist.total -= 1;
    writeFile(pathFile, JSON.stringify(playlists, null, 2), "utf8");

    return true;
  }

  /**
   *
   * @param {*} folder
   * @param {*} path
   * @returns
   */
  static getSubfolder(folder, path) {
    // If we dwelve deeper in the tree
    if (path.includes("/")) {
      // We remove the first "/"
      path = path.substring(1, path.length);

      const index = path.includes("/") ? path.indexOf("/") : path.length;
      const currentPath = path.substring(0, index);
      const nextPath = path.substring(index, path.length);
      const nextFolder = folder.folders.find((f) => f.name === currentPath);

      if (!nextFolder) {
        throw new Error("Invalid path !");
      }

      return this.getSubfolder(nextFolder, nextPath);
    }

    // Return current folder
    return folder;
  }
}
