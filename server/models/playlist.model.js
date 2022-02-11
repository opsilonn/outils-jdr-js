import fs from "fs";
import path from "path";
import { promisify } from "util";
import { v4 as uuidv4 } from "uuid";

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const pathFile = path.join(__dirname, "../data/playlists.json");
const pathFileSave = path.join(__dirname, "../data/playlists_save.json");

export default class Playlist {
  /** @type {String} */
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
    this.rootFolder = [];
    this.total = newObj.total || 0;
  }

  /**
   * @param {String} id
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
   * @param {String} id
   * @returns {Promise<Playlist>}
   */
  static async getSaved(id) {
    // Read the audio
    const playlists = await this.getAll(pathFileSave);

    // Find the correct playlist
    let playlist = playlists.find((_) => _.id === id);

    // If the playlist was not found : get the actual one
    if (!playlist) {
      playlist = await this.get(id);
      if (!playlist) {
        throw new Error("Playlist not found !");
      }
    }

    return playlist;
  }

  /**
   * @returns {Promise<Playlist[]>}
   */
  static async getAll(path = pathFile) {
    // Read the audio
    const playlists = await readFile(path, "utf8");

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
      id: uuidv4(),
      name: playlistReceived.name,
    });

    // Add new Playlist
    playlists.push(playlist);
    writeFile(pathFile, JSON.stringify(playlists, null, 2), "utf8");

    return playlist;
  }

  /**
   *
   * @param {String} id
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
   * @param {String} id
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
   * @param {String} idPlaylist
   * @param {Audio} audio
   * @param {String} path
   * @param {Number} index
   * @returns {Promise<Playlist>}
   */
  static async addAudio(idPlaylist, audio, idFolder, index) {
    // Get all the playlists (of saves !)
    let playlistsSaved = await this.getAll(pathFileSave);

    // We get the wanted playlist
    let playlist = playlistsSaved.find((_) => _.id === idPlaylist);
    // If not found : We get the source one, from the "actual" database
    if (!playlist) {
      // Get all the actual playlists
      const playlists = await this.getAll();

      // We get the source playlist
      playlist = playlists.find((_) => _.id === idPlaylist);
      if (!playlist) {
        throw new Error("Playlist not found !");
      }

      playlistsSaved.push(playlist);
    }

    // We initialize the new Audio
    const newAudio = {
      id: uuidv4(),
      name: audio.name,
      surname: "",
      path: audio.path,
    };
    playlist.total += 1;

    // If no id was given : add to the root of the playlist
    if (idFolder === "") {
      // Check for valid index
      if (index < 0 || playlist.rootFolder.length < index) {
        throw new Error("Incorrect index !");
      }

      // Add to playlist
      playlist.rootFolder.splice(index, 0, newAudio);
    } else {
      // We fetch the folder in the arborescence
      let folder = {};
      try {
        folder = this.getFolderByItemId(idFolder, playlist.rootFolder);
      } catch (err) {
        throw new Error("Invalid folder ID !");
      }

      if (!folder) {
        throw new Error("Incorrect folder ID !");
      }

      // Check for valid index
      if (index < 0 || folder.children.length < index) {
        throw new Error("Incorrect index !");
      }

      // Add to playlist
      folder.children.splice(index, 0, newAudio);
    }

    writeFile(pathFileSave, JSON.stringify(playlistsSaved, null, 2), "utf8");

    return playlist;
  }

  /**
   *
   * @param {String} idPlaylist
   * @param {String} idAudio
   * @param {Audio} audioReceived
   * @param {String} path
   * @returns {Promise<Playlist>}
   */
  static async updateAudio(idPlaylist, idAudio, audioReceived, path) {
    // Get all the playlists
    let playlists = await this.getAll(pathFileSave);

    // We get the wanted playlist
    let playlist = playlists.find((_) => _.id === idPlaylist);

    // If not found : We get the source one, from the "actual" database
    if (!playlist) {
      // Get all the actual playlists
      playlists = await this.getAll();

      // We get the source playlist
      playlist = playlists.find((_) => _.id === idPlaylist);
      if (!playlist) {
        throw new Error("Playlist not found !");
      }
    }

    // We fetch the folder in the arborescence
    let folder = {};
    try {
      folder = this.getSubfolderByPath(playlist.rootFolder, path);
    } catch (err) {
      throw new Error("Invalid path !");
    }

    // We update the file
    const file = folder.files.find((f) => f.id === idAudio);
    file.surname = audioReceived.surname || "";

    writeFile(pathFileSave, JSON.stringify(playlists, null, 2), "utf8");
    return playlist;
  }

  /**
   * @param {String} idPlaylist
   * @param {String} idItem
   */
  static async deleteItem(idPlaylist, idItem) {
    // Get all the playlists
    let playlists = await this.getAll(pathFileSave);

    // We get the wanted playlist
    const playlist = playlists.find((_) => _.id === idPlaylist);

    // If not found : We get the source one, from the "actual" database
    if (!playlist) {
      // Get all the actual playlists
      playlists = await this.getAll();

      // We get the source playlist
      playlist = playlists.find((_) => _.id === idPlaylist);
      if (!playlist) {
        throw new Error("Playlist not found !");
      }
    }

    // We fetch the folder in the arborescence
    let folder = {};
    try {
      folder = this.getParentFolderByItemId(idItem, playlist.rootFolder);
    } catch (err) {
      throw new Error("Invalid ID !");
    }

    if (!!folder && !!folder.id) {
      // folder found (and not the root folder)
      const indexFile = folder.children.findIndex((file) => file.id === idItem);
      folder.children.splice(indexFile, 1);
    } else {
      // No folder found : remove from root
      const indexFile = playlist.rootFolder.findIndex((file) => file.id === idItem);
      playlist.rootFolder.splice(indexFile, 1);
    }

    // Remove file from Playlist
    playlist.total--;
    writeFile(pathFileSave, JSON.stringify(playlists, null, 2), "utf8");

    return playlist;
  }

  /**
   *
   * @param {String} idPlaylist
   * @returns {Promise<Playlist>}
   */
  static async savePlaylist(idPlaylist) {
    // We get the wanted playlist
    const playlistToSave = (await this.getAll(pathFileSave)).find((_) => _.id === idPlaylist);

    // If not found : Error
    if (!playlistToSave) {
      throw new Error("Playlist not found !");
    }

    // Get all the playlists
    let playlists = await this.getAll();
    // We get the index of the playlist to override
    const index = playlists.findIndex((_) => _.id === idPlaylist);

    // If not found : Error
    if (0 < index) {
      throw new Error("Playlist not found !");
    }

    playlists[index] = playlistToSave;

    writeFile(pathFile, JSON.stringify(playlists, null, 2), "utf8");
    return playlistToSave;
  }

  /**
   *
   * @param {String} idPlaylist
   * @returns {Promise<Playlist>}
   */
  static async resetPlaylist(idPlaylist) {
    // We get the wanted playlist
    const playlistToSave = (await this.getAll()).find((_) => _.id === idPlaylist);

    // If not found : Error
    if (!playlistToSave) {
      throw new Error("Playlist not found !");
    }

    // Get all the playlists
    let playlists = await this.getAll(pathFileSave);
    // We get the index of the playlist to override
    const index = playlists.findIndex((_) => _.id === idPlaylist);

    // If not found : Error
    if (0 < index) {
      throw new Error("Playlist not found !");
    }

    playlists[index] = playlistToSave;

    writeFile(pathFile, JSON.stringify(playlists, null, 2), "utf8");
    return playlistToSave;
  }

  // UTILS

  /**
   *
   * @param {*} folder
   * @param {*} path
   * @returns
   */
  static getSubfolderByPath(folder, path) {
    // If we delve deeper in the tree
    if (path[0] === "/") {
      // We remove the first "/"
      path = path.substring(1, path.length);

      const index = path.includes("/") ? path.indexOf("/") : path.length;
      const currentPath = path.substring(0, index);
      const nextPath = path.substring(index, path.length);
      const nextFolder = folder.folders.find((f) => f.name === currentPath);

      if (!nextFolder) {
        throw new Error("Invalid path !");
      }

      return this.getSubfolderByPath(nextFolder, nextPath);
    }

    // Return current folder
    return folder;
  }

  /**
   * FIXME Returns a folder given its ID, or one of its children ID
   * @param {*} id
   * @param {*} folder
   * @returns
   */
  static getFolderByItemId(id, folder) {
    for (let i = 0; i < folder.length; i++) {
      const item = folder[i];

      if ((!!item.children && item.id === id) || !!(item.children || []).find((el) => !el.children && el.id === id)) {
        return item;
      }

      if (!!item.children) {
        const returnedItem = this.getFolderByItemId(id, item.children);
        if (!!returnedItem) {
          return returnedItem;
        }
      }
    }
  }

  /**
   * FIXME Returns a folder given its ID, or one of its children ID
   * @param {*} id
   * @param {*} folder
   * @returns
   */
  static getParentFolderByItemId(id, folder) {
    for (let i = 0; i < folder.length; i++) {
      const item = folder[i];

      if (!!item.children) {
        if (!!item.children.find((el) => el.id === id)) {
          return item;
        }

        const returnedItem = this.getFolderByItemId(id, item.children);
        if (!!returnedItem) {
          return returnedItem;
        }
      }
    }
  }
}
