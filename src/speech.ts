import type {
	JSONObject,
	SharedV2Headers,
	SharedV3Warning,
	SpeechModelV3,
	SpeechModelV3CallOptions,
} from "@ai-sdk/provider";

const yandexSpeechVoices = [
	"alena",
	"filipp",
	"ermil",
	"jane",
	"omazh",
	"zahar",
	"dasha",
	"julia",
	"lera",
	"masha",
	"marina",
	"alexander",
	"kirill",
	"anton",
	"madi_ru",
	"saule_ru",
	"zamira_ru",
	"zhanar_ru",
	"yulduz_ru",
] as const;

export type YandexSpeechVoice = (typeof yandexSpeechVoices)[number];

const voiceEmotions = {
	alena: ["neutral", "good"] as const,
	filipp: ["neutral"] as const,
	ermil: ["neutral", "good"] as const,
	jane: ["neutral", "good", "evil"] as const,
	omazh: ["neutral", "evil"] as const,
	zahar: ["neutral", "good"] as const,
	dasha: ["neutral", "good", "friendly"] as const,
	julia: ["neutral", "strict"] as const,
	lera: ["neutral", "friendly"] as const,
	masha: ["good", "strict", "friendly"] as const,
	marina: ["neutral", "whisper", "friendly"] as const,
	alexander: ["neutral", "good"] as const,
	kirill: ["neutral", "strict", "good"] as const,
	anton: ["neutral", "good"] as const,
	madi_ru: ["neutral"] as const,
	saule_ru: ["neutral", "strict", "whisper"] as const,
	zamira_ru: ["neutral", "strict", "friendly"] as const,
	zhanar_ru: ["neutral", "strict", "friendly"] as const,
	yulduz_ru: ["neutral", "strict", "friendly", "whisper"] as const,
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

export class YandexSpeechModel implements SpeechModelV3 {
	private folderId: string;
	private secretKey: string;

	readonly specificationVersion = "v3";
	readonly provider = "yandex-cloud";
	readonly modelId = "tts:synthesize";

	constructor({
		folderId,
		secretKey,
	}: { folderId: string; secretKey: string }) {
		this.folderId = folderId;
		this.secretKey = secretKey;
	}

	private sanitizeInput(input: string): string {
		return input.replace(/[^a-zA-Z0-9а-яА-ЯёЁ]/g, " ");
	}

	async doGenerate(options: SpeechModelV3CallOptions): Promise<{
		audio: string | Uint8Array;
		warnings: Array<SharedV3Warning>;
		request?: { body?: unknown };
		response: {
			timestamp: Date;
			modelId: string;
			headers?: SharedV2Headers;
			body?: unknown;
		};
		providerMetadata?: Record<string, JSONObject>;
	}> {
		const po =
			options.providerOptions as YandexSpeechProviderOptions<YandexSpeechVoice>;

		const requestBody = {
			text: this.sanitizeInput(options.text),
			voice: options.voice,
			lang: options.language,
			emotion: po.emotion,
			speed: options.speed,
			format: options.outputFormat,
			sampleRateHertz: po.sampleRateHertz,
			folderId: this.folderId,
		};

		console.log(requestBody.text);

		const formData = new URLSearchParams();
		for (const [key, value] of Object.entries(requestBody)) {
			if (value !== undefined && value !== null) {
				formData.append(key, String(value));
			}
		}

		const response = await fetch(
			"https://tts.api.cloud.yandex.net/speech/v1/tts:synthesize",
			{
				method: "POST",
				headers: {
					Authorization: `Api-Key ${this.secretKey}`,
					"Content-Type": "application/x-www-form-urlencoded",
				},
				body: formData.toString(),
			},
		);

		if (!response.ok) {
			throw new Error(
				`Yandex TTS API error: ${response.status} ${response.statusText}`,
			);
		}

		const arrayBuffer = await response.arrayBuffer();
		const audio = new Uint8Array(arrayBuffer);

		return {
			audio,
			warnings: [],
			request: { body: requestBody },
			response: {
				timestamp: new Date(),
				modelId: this.modelId,
				headers: Object.fromEntries(
					response.headers.entries(),
				) as SharedV2Headers,
				body: audio,
			},
		};
	}
}
