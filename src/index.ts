import { readFileSync } from "node:fs";
import { YandexTranscriptModel } from "./transcript";
import url from "./public/audio.ogg?url";

export * from "./chat";

const FOLDER_ID = process.env.FOLDER_ID;
const SECRET_KEY = process.env.SK;

if (!FOLDER_ID || !SECRET_KEY) {
	throw new Error("FOLDER_ID and SECRET_KEY must be set");
}

const audioBuffer = readFileSync(url);

export const stt = new YandexTranscriptModel({
	folderId: FOLDER_ID,
	secretKey: SECRET_KEY,
});

const { text } = await stt.doGenerate({
	audio: audioBuffer,
	mediaType: "audio/ogg",
	providerOptions: {
		lang: "auto",
		rawResults: false,
		format: "oggopus",
		sampleRateHertz: 48000,
	},
	headers: {},
	abortSignal: new AbortController().signal,
});

console.log(text);
