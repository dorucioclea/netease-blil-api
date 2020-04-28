"use strict";
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const netease_music_sdk_1 = require("netease-music-sdk");
const fs_1 = __importDefault(require("fs"));
const path_1 = require("path");
const date_fns_1 = require("date-fns");
class NeteaseMusic extends netease_music_sdk_1.MusicClient {
    constructor(phoneNumber, password) {
        super();
        this.phoneNumber = phoneNumber;
        this.password = password;
        this.tempPath = path_1.join(__dirname, '../temp');
        if (fs_1.default.existsSync(this.tempPath)) {
            if (fs_1.default.statSync(this.tempPath).isDirectory()) {
                return;
            }
            throw new Error('temp 被占用');
        }
        else {
            fs_1.default.mkdirSync(this.tempPath);
        }
    }
    async Login() {
        const cookiePath = path_1.join(this.tempPath, './cookie');
        if (fs_1.default.existsSync(cookiePath)) {
            this.load(JSON.parse(fs_1.default.readFileSync(path_1.resolve(this.tempPath, './cookie')).toString()));
            if (!this.isLogin) {
                fs_1.default.unlinkSync(cookiePath);
                this.Login();
            }
        }
        else {
            await this.phoneLogin(this.phoneNumber, this.password);
            const userStore = JSON.stringify(this.user.toJSON());
            fs_1.default.writeFileSync(cookiePath, userStore);
        }
        return this.user;
    }
    async getRecordAndParseData(type, len = 10) {
        const record = await this.getUserRecord(this.user.id, type);
        const data = type === netease_music_sdk_1.UserRecordType.ALL ? record.allData : record.weekData;
        return data
            .map((data) => {
            const song = data.song;
            return {
                id: song.id,
                time: date_fns_1.format(new Date(song.dt), 'mm:ss'),
                picUrl: song.al.picUrl,
                name: song.name,
                author: song.ar
                    .map((item) => {
                    return item.name;
                })
                    .join(' & '),
                playCount: data.playCount,
            };
        })
            .sort((a, b) => b.playCount - a.playCount)
            .slice(0, len);
    }
    async getWeekData(len = 10) {
        return await this.getRecordAndParseData(netease_music_sdk_1.UserRecordType.WEEK, len);
    }
    async getAllData(len = 10) {
        return await this.getRecordAndParseData(netease_music_sdk_1.UserRecordType.ALL, len);
    }
    async getPlaylistInfo(id) {
        const playlistInfo = await super.getPlaylistInfo(id);
        const playListData = playlistInfo.playlist;
        const tracks = playListData.tracks.map((song) => {
            return {
                id: song.id,
                time: date_fns_1.format(new Date(song.dt), 'mm:ss'),
                picUrl: song.al.picUrl,
                name: song.name,
                author: song.ar
                    .map((item) => {
                    return item.name;
                })
                    .join(' & '),
            };
        });
        return {
            id,
            coverImgUrl: playListData.coverImgUrl,
            coverImgId: playListData.coverImgId,
            playCount: playListData.playCount,
            name: playListData.name,
            data: tracks,
        };
    }
    async getFavorite() {
        var _a;
        const allPlayListData = await this.getUserPlaylist(this.user.id);
        const playListId = (_a = allPlayListData.playlist) === null || _a === void 0 ? void 0 : _a.shift().id;
        return await this.getPlaylistInfo(playListId);
    }
    async getMusicUrl(id) {
        const music = await super.getMusicUrl(id);
        const { songs } = (await this.getSongInfo(parseInt(id)));
        const song = songs[0];
        const raw = music.data[0];
        return {
            id: raw.id,
            url: raw.url,
            size: (raw.size / 1024 / 1024).toFixed(2) + 'MB',
            type: raw.type,
            title: song.name,
            album: song.al.name,
            author: song.ar.map((a) => a.name).join(' & '),
            cover: song.al.picUrl,
        };
    }
    async getMusicsUrl(ids) {
        var e_1, _a;
        const songs = [];
        try {
            for (var ids_1 = __asyncValues(ids), ids_1_1; ids_1_1 = await ids_1.next(), !ids_1_1.done;) {
                const id = ids_1_1.value;
                songs.push(await this.getMusicUrl(id));
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (ids_1_1 && !ids_1_1.done && (_a = ids_1.return)) await _a.call(ids_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return { songs };
    }
}
exports.NeteaseMusic = NeteaseMusic;
