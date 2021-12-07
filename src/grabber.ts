import { io, Socket } from 'socket.io-client';
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import { Helpers } from "./helpers.js";

export interface CPGrabberOptions {
  room: string;
  detectNSFW?: boolean;
  splitByOwner: boolean;
  saveAllMedia: boolean;
  keywords: string[];
}

export class CPGrabber implements CPGrabberOptions {

  private client: Socket;
  room: string = `15min`;
  detectNSFW: boolean = false;
  splitByOwner: boolean = true;
  saveAllMedia: boolean = false;
  keywords: string[] = [
    'risk',
    '10s',
    '5s',
    '3s'
  ];

  data : any = {
    user: {},
  };

  constructor(options?: CPGrabberOptions) {
    Object.assign(this, {...options});

    this.client = io("wss://chatpic.org/?EIO=3&transport=websocket", {
      reconnectionDelayMax: 10000,
      path: '/socket.io'
    });
//    headers: {
//      'Content-Type': 'multipart/form-data',
//      'room-id': this.data.room._id,
//      'token': this.data.token,
//      'origin': `https://chatpic.org`,
//      'referer': `https://chatpic.org/r/${this.room}`,
//      'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.99 Safari/537.36'
//    }

    this.client.on('close', this.onClose.bind(this));
    this.client.on('error', this.onError.bind(this));
    this.client.on('connect', this.onConnect.bind(this));
  }

  // private

  private async onConnect() {
    console.log(`connection with chatpic.org open! creating user...`);

    this.client.emit('get-ads');
    this.client.emit('create-user', Helpers.makeUserId(), this.onCreateUser.bind(this));
  }

  private onCreateUser(data: any) {
    console.log(`user created! getting channels...`);

    this.data.token = data.token || {};
    this.data.user = data.user || {};

    this.client.emit('get-channels', this.onGetchannels.bind(this));
  }

  private onGetchannels(data: any) {
    console.log(`channels received! joining room '${this.room}'...`);

    this.client.emit('join', { roomName: this.room, parentRoomName: null }, this.onJoinRoom.bind(this));
  }

  private onJoinRoom(data: any) {
    console.log(`room '${this.room}' joined! awaiting media...`);

    this.data.room = data.room || {};

    this.client.on('media', this.onIncomingMedia.bind(this));
  }

  private async onIncomingMedia(data: any) {
    try {
      let foundSample = false;
      let isRisk = false;

      for (const kwd of this.keywords) {
        if (data.name.toLowerCase().indexOf(kwd) > -1 || this.saveAllMedia) {
          isRisk = true;
          break;
        }
      }
      
      const url = `https://chatpic.org/media/${data.filename}`;
      
      fetch(url).then((response) => {
        response.buffer().then(async (imageBuffer) => {

          let savePath = path.join(__dirname, '/../../saves');
    
          if (this.splitByOwner) {
            savePath = path.join(savePath, data.ownerNickname);
          }

          if (!data.filename) {
            return;
          }
          
          if (isRisk) {
            if (!fs.existsSync(savePath)) {
              fs.mkdirSync(savePath);
            }

            savePath = path.join(savePath, data.filename);
            const metaSavePath = `${savePath}.json`;
            console.log(`new media from @${data.ownerNickname} (${data.type}) incoming... we got a risk! title: ${data.name}`);
            fs.writeFile(savePath, imageBuffer, () => {});
            fs.writeFile(metaSavePath, JSON.stringify(data, null, 2), () => {});
          }
        });
      });
    } catch (error) {
      console.log(error);
    }
  }

  private onClose() {
    console.log(`connection closed :(`);
  }

  private onError(err: any) {
      console.log(`error:`, err);
    }
}
