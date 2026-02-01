import type {
	JSONObject,
	SharedV3Headers,
	SharedV3Warning,
	TranscriptionModelV3,
	TranscriptionModelV3CallOptions,
} from "@ai-sdk/provider";

export interface YandexTranscriptProviderOptions
	extends TranscriptionModelV3CallOptions {
	audio: string | Uint8Array<ArrayBufferLike>;
	mediaType: string;
	providerOptions: YandexTranscruiptRequest;
	abortSignal: AbortSignal;
	headers: Record<string, string | undefined>;
}

export type YandexTranscruiptRequest = {
	lang:
		| "auto"
		| "ru-RU"
		| "en-US"
		| "de-DE"
		| "es-ES"
		| "fr-FR"
		| "it-IT"
		| "pt-PT"
		| "pt-BR"
		| "nl-NL"
		| "sv-SE"
		| "fi-FI"
		| "tr-TR"
		| "he-IL"
		| "kk-KZ"
		| "pl-PL"
		| "uz-UZ";
	rawResults: boolean;
	format: "lpcm" | "oggopus";
	sampleRateHertz: 48000 | 16000 | 8000;
} & Record<string, any>;

export type YandexTranscriptAnswer = {
	result: string;
};

export class YandexTranscriptModel implements TranscriptionModelV3 {
	private folderId: string;
	private secretKey: string;

	readonly specificationVersion = "v3";
	readonly provider = "yandex-cloud";
	readonly modelId = "sst:recognize";

	constructor({
		folderId,
		secretKey,
	}: { folderId: string; secretKey: string }) {
		this.folderId = folderId;
		this.secretKey = secretKey;
	}

	async doGenerate(options: YandexTranscriptProviderOptions): Promise<{
		text: string;
		segments: Array<{ text: string; startSecond: number; endSecond: number }>;
		language: string | undefined;
		durationInSeconds: number | undefined;
		warnings: Array<SharedV3Warning>;
		request?: { body?: string };
		response: {
			timestamp: Date;
			modelId: string;
			headers?: SharedV3Headers;
			body?: unknown;
		};
		providerMetadata?: Record<string, JSONObject>;
	}> {
		const queryParams = new URLSearchParams(
			Object.entries({
				...options.providerOptions,
				folderId: this.folderId,
			}).reduce(
				(acc, [key, value]) => {
					if (value !== undefined) {
						acc[key] = String(value);
					}
					return acc;
				},
				{} as Record<string, string>,
			),
		);

		console.log(queryParams);

		const response = await fetch(
			`https://stt.api.cloud.yandex.net/speech/v1/stt:recognize?${queryParams}`,
			{
				method: "POST",
				headers: {
					Authorization: `Api-Key ${this.secretKey}`,
					"Content-Type": "application/octet-stream",
				},
				body: options.audio,
			},
		);

		if (!response.ok) {
			throw new Error(
				`Yandex STT API error: ${response.status} ${response.statusText}`,
			);
		}

		const data = (await response.json()) as { result: string };

		return {
			text: data.result.length > 0 ? data.result : "нет звуков",
			segments: [],
			language: undefined,
			durationInSeconds: undefined,
			warnings: [],
			request: {
				body: queryParams.toString(),
			},
			response: {
				timestamp: new Date(),
				modelId: this.modelId,
				headers: Object.fromEntries(
					response.headers.entries(),
				) as SharedV3Headers,
				body: data,
			},
		};
	}
}
