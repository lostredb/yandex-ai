export const VOICES = [
	"alena",
	"filipp",
	"ermil",
	"jane",
	"omazh",
	"zahar",
	"marina",
	"madi_ru",
] as const;

export type YandexSpeechVoice = (typeof VOICES)[number];

const voiceEmotions = {
	alena: ["neutral", "good"] as const,
	filipp: ["neutral"] as const,
	ermil: ["neutral", "good"] as const,
	jane: ["neutral", "good", "evil"] as const,
	omazh: ["neutral", "evil"] as const,
	zahar: ["neutral", "good"] as const,
	marina: ["neutral", "whisper", "friendly"] as const,
	madi_ru: ["neutral"] as const,
} as const;

export type YandexSpeechEmotionFor<T extends YandexSpeechVoice> =
	(typeof voiceEmotions)[T][number];

export type YandexSpeechProviderOptions<T extends YandexSpeechVoice> = {
	emotion?: YandexSpeechEmotionFor<T>;
	sampleRateHertz?: 48000 | 16000 | 8000;
};

export type YandexSpeechOptions<T extends YandexSpeechVoice> = {
	voice: T;
	speed?: number;
	providerOptions?: YandexSpeechProviderOptions<T>;
	outputFormat?: "mp3" | "oggopus" | "lpcm";
};
