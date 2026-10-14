import * as ort from 'onnxruntime-web/wasm';
import ortWasmUrl from 'onnxruntime-web/ort-wasm-simd-threaded.wasm?url';
import ortGlueUrl from 'onnxruntime-web/ort-wasm-simd-threaded.mjs?url';
import { ConfigService } from '../config';

const ASSETS_PATH = '/spam-detector';
const TOKENS_LENGTH = 128;
const POINTER_SIZE = 4;

interface TokenizerModule {
  _malloc: (size: number) => number;
  _free: (pointer: number) => void;
  _tokenizer: (
    tokens: number,
    mask: number,
    text: number,
    vocab: number,
    merges: number,
    tokensLength: number,
    vocabLength: number,
    mergesLength: number,
  ) => void;
  lengthBytesUTF8: (text: string) => number;
  stringToUTF8: (text: string, pointer: number, maxBytes: number) => void;
  setValue: (pointer: number, value: number, type: string) => void;
  HEAP32: Int32Array;
  HEAPF32: Float32Array;
}

declare global {
  interface Window {
    Module?: () => Promise<TokenizerModule>;
  }
}

interface Detector {
  session: ort.InferenceSession;
  tokenize: (text: string) => { tokens: BigInt64Array; mask: Float32Array };
}

export interface SpamPrediction {
  isSpam: boolean;
  spamProbability: number;
}

export class SpamDetectorService {
  public static readonly instance: SpamDetectorService = new SpamDetectorService();

  private detector?: Promise<Detector>;

  /**
   * Classifies a text as spam or not with the spam model, running entirely in the browser.
   * The model, tokenizer and vocabulary are downloaded on the first call.
   */
  public async predict(text: string): Promise<SpamPrediction> {
    const { session, tokenize } = await this.getDetector();
    const { tokens, mask } = tokenize(text.replaceAll('\n', ' '));

    const result = await session.run({
      input: new ort.Tensor('int64', tokens, [1, TOKENS_LENGTH]),
      attention: new ort.Tensor('float32', mask, [1, TOKENS_LENGTH]),
    });
    const [hamScore, spamScore] = result.output.data as Float32Array;
    const spamProbability = 1 / (1 + Math.exp(hamScore - spamScore));

    return { isSpam: spamProbability > 0.5, spamProbability };
  }

  private getDetector(): Promise<Detector> {
    this.detector ??= this.loadDetector().catch((error) => {
      this.detector = undefined;
      throw error;
    });
    return this.detector;
  }

  private async loadDetector(): Promise<Detector> {
    ort.env.wasm.wasmPaths = { wasm: ortWasmUrl, mjs: ortGlueUrl };
    ort.env.wasm.numThreads = 1;

    const [session, tokenizer, vocab, merges] = await Promise.all([
      ort.InferenceSession.create(ConfigService.instance.getVariable('SPAM_MODEL_URL'), {
        executionProviders: ['wasm'],
      }),
      this.loadTokenizer(),
      this.loadVocab(),
      this.loadMerges(),
    ]);

    const vocabPointer = this.writeStringArray(tokenizer, vocab);
    const mergesPointer = this.writeStringArray(tokenizer, merges);

    const tokenize = (text: string) => {
      const textPointer = this.writeString(tokenizer, text);
      const tokensPointer = tokenizer._malloc(TOKENS_LENGTH * POINTER_SIZE);
      const maskPointer = tokenizer._malloc(TOKENS_LENGTH * POINTER_SIZE);

      tokenizer._tokenizer(
        tokensPointer,
        maskPointer,
        textPointer,
        vocabPointer,
        mergesPointer,
        TOKENS_LENGTH,
        vocab.length,
        merges.length,
      );

      const tokens = BigInt64Array.from(
        new Int32Array(tokenizer.HEAP32.buffer, tokensPointer, TOKENS_LENGTH),
        (token) => BigInt(token),
      );
      const mask = new Float32Array(new Float32Array(tokenizer.HEAPF32.buffer, maskPointer, TOKENS_LENGTH));

      tokenizer._free(textPointer);
      tokenizer._free(tokensPointer);
      tokenizer._free(maskPointer);

      return { tokens, mask };
    };

    return { session, tokenize };
  }

  private loadTokenizer(): Promise<TokenizerModule> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `${ASSETS_PATH}/tokenizer.js`;
      script.onload = () => window.Module?.().then(resolve, reject);
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }

  // The tokenizer expects the vocabulary as "<id> <token>" lines, parsed exactly as during training
  private async loadVocab(): Promise<string[]> {
    const text = await (await fetch(`${ASSETS_PATH}/vocab_all_18k.json`)).text();
    return text
      .slice(2, -2)
      .split('\n')
      .map((line) => {
        const [token, id] = line.trim().replace(/,$/, '').replaceAll('"', '').replaceAll(': ', ' ').split(' ');
        return `${id} ${token}`;
      });
  }

  private async loadMerges(): Promise<string[]> {
    const text = await (await fetch(`${ASSETS_PATH}/merges_all_18k.txt`)).text();
    return text
      .split('\n')
      .slice(0, -1)
      .map((line) => line.trim());
  }

  private writeString(tokenizer: TokenizerModule, text: string): number {
    const size = tokenizer.lengthBytesUTF8(text) + 1;
    const pointer = tokenizer._malloc(size);
    tokenizer.stringToUTF8(text, pointer, size);
    return pointer;
  }

  private writeStringArray(tokenizer: TokenizerModule, values: string[]): number {
    const arrayPointer = tokenizer._malloc(values.length * POINTER_SIZE);
    values.forEach((value, index) => {
      tokenizer.setValue(arrayPointer + index * POINTER_SIZE, this.writeString(tokenizer, value), '*');
    });
    return arrayPointer;
  }
}
