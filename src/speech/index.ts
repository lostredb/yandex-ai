import type {
	JSONObject,
	SharedV2Headers,
	SharedV3Warning,
	SpeechModelV3,
	SpeechModelV3CallOptions,
} from "@ai-sdk/provider";
import type { YandexSpeechEmotionFor, YandexSpeechVoice } from "./voice";

export type YandexSpeechLanguage = "ru-Ru" | "auto";

export type YandexSpeechFormat = "lcpm" | "oggopus" | "mp3";

export type YandexSpeechRequest<V extends YandexSpeechVoice> = {
	/**
	 * Language.
	 */
	lang?: YandexSpeechLanguage;

	/**
	 * Preferred speech synthesis voice from [the list](https://yandex.cloud/en/docs/speechkit/tts/voices).
	 */
	voice?: V;

	/**
	 * Role or emotional tone of the voice.
	 * Supported only for Russian (ru-RU).
	 */
	emotion?: YandexSpeechEmotionFor<V>;

	/**
	 * Synthesized speech rate.
	 * The rate of speech is set as a decimal number in the range from 0.1 to 3.0. Where:
	 * 3.0: Fastest rate.
	 * 1.0 (default): Average human speech rate.
	 * 0.1: Slowest speech rate.
	 */
	speed?: number;

	/**
	 * Synthesized audio format.
	 */
	format?: YandexSpeechFormat;

	/**
	 * Synthesized audio sampling frequency.
	 * Applies if format equals lpcm.
	 */
	sampleRateHertz?: 48000 | 16000 | 8000;

	/**
	 * Internal auth parameter.
	 */
	folderId?: string;
} & (
	| {
			/**
			 * UTF-8 encoded text to convert to speech.
			 * To control pronunciation (pause, emphasis, and stress), use [TTS markup](https://yandex.cloud/en/docs/speechkit/tts/markup/tts-markup).
			 * Maximum string length: 5,000 characters.
			 */
			text: string;
			ssml?: undefined;
	  }
	| {
			/**
			 * [SSML](https://yandex.cloud/en/docs/speechkit/tts/markup/ssml) text to convert to speech.
			 */
			ssml: string;
			text?: undefined;
	  }
);

export interface YandexSpeechGenerateOptions<V extends YandexSpeechVoice>
	extends SpeechModelV3CallOptions {
	/**
	 * The speech model to use.
	 */
	model: YandexSpeechModel;
	/**
	 * The text to convert to speech.
	 */
	text: string;
	/**
	 * Preferred speech synthesis voice from [the list](https://yandex.cloud/en/docs/speechkit/tts/voices).
	 */
	voice?: V;
	/**
	 * Synthesized audio format.
	 */
	outputFormat?: YandexSpeechFormat;
	/**
	 * Emotion
	 */
	instructions?: YandexSpeechEmotionFor<V>;
	/**
	 * Synthesized speech rate.
	 * The rate of speech is set as a decimal number in the range from 0.1 to 3.0. Where:
	 * 3.0: Fastest rate.
	 * 1.0 (default): Average human speech rate.
	 * 0.1: Slowest speech rate.
	 */
	speed?: number;
	/**
	 * The language for speech generation. This should be an ISO 639-1 language code (e.g. "en", "es", "fr")
	 * or "auto" for automatic language detection. Provider support varies.
	 */
	language?: YandexSpeechLanguage;
	/**
	 * Additional provider-specific options that are passed through to the provider
	 * as body parameters.
	 *
	 * The outer record is keyed by the provider name, and the inner
	 * record is keyed by the provider-specific metadata key.
	 * ```ts
	 * {
	 * "openai": {}
	 * }
	 * ```
	 */
	providerOptions?: {
		yandex?: {
			/**
			 * Synthesized audio sampling frequency.
			 * Applies if format equals lpcm.
			 */
			sampleRateHertz?: 48000 | 16000 | 8000;
		} & (
			| {
					type: "text";
			  }
			| {
					type: "ssml";
			  }
		);
	};
	/**
	 * Maximum number of retries per speech model call. Set to 0 to disable retries.
	 *
	 * @default 2
	 */
	maxRetries?: number;
	/**
	 * Abort signal.
	 */
	abortSignal?: AbortSignal;
	/**
	 * Additional headers to include in the request.
	 * Only applicable for HTTP-based providers.
	 */
	headers?: Record<string, string>;
}

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

	async doGenerate<V extends YandexSpeechVoice>(
		options: YandexSpeechGenerateOptions<V>,
	): Promise<{
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
		const baseBody: Omit<YandexSpeechRequest<V>, "text" | "ssml"> = {
			lang: options.language,
			speed: options.speed,
			voice: options.voice,
			emotion: options.instructions,
			format: options.outputFormat,
			sampleRateHertz: options.providerOptions?.yandex?.sampleRateHertz,
			folderId: this.folderId,
		};

		const body: YandexSpeechRequest<V> =
			options.providerOptions?.yandex?.type === "ssml"
				? {
						...baseBody,
						ssml: options.text,
					}
				: {
						...baseBody,
						text: options.text,
					};

		const searchParams = new URLSearchParams();
		for (const [key, value] of Object.entries(body)) {
			if (value !== undefined && value !== null) {
				searchParams.append(key, String(value));
			}
		}

		const response = await fetch(
			`https://tts.api.cloud.yandex.net/speech/v1/tts:synthesize?${searchParams.toString()}`,
			{
				method: "POST",
				headers: {
					Authorization: `Api-Key ${this.secretKey}`,
					"Content-Type": "application/x-www-form-urlencoded",
					...options.headers,
				},
				signal: options.abortSignal,
			},
		);

		if (!response.ok) {
			throw new Error(
				`Yandex TTS API error: ${response.status} ${response.statusText}: ${await response.text()}`,
			);
		}

		const audio = new Uint8Array(await response.arrayBuffer());

		return {
			audio,
			warnings: [],
			request: { body },
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
