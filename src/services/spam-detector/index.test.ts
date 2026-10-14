import { beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  run: vi.fn(),
  createSession: vi.fn(),
  getVariable: vi.fn(),
}));

vi.mock('onnxruntime-web/wasm', () => ({
  env: { wasm: {} },
  InferenceSession: { create: mocks.createSession },
  Tensor: class {
    constructor(
      public type: string,
      public data: unknown,
      public dims: number[],
    ) {}
  },
}));
vi.mock('onnxruntime-web/ort-wasm-simd-threaded.wasm?url', () => ({ default: '/ort.wasm' }));
vi.mock('onnxruntime-web/ort-wasm-simd-threaded.mjs?url', () => ({ default: '/ort.mjs' }));
vi.mock('../config', () => ({ ConfigService: { instance: { getVariable: mocks.getVariable } } }));

const fakeTokenizer = () => {
  const memory = new ArrayBuffer(1024 * 1024);
  let next = 8;
  return {
    HEAP32: new Int32Array(memory),
    HEAPF32: new Float32Array(memory),
    _malloc: (size: number) => {
      const pointer = next;
      next += Math.ceil(size / 8) * 8;
      return pointer;
    },
    _free: vi.fn(),
    _tokenizer: vi.fn(),
    lengthBytesUTF8: (text: string) => text.length,
    stringToUTF8: vi.fn(),
    setValue: vi.fn(),
  };
};

const scores = (ham: number, spam: number) => ({ output: { data: new Float32Array([ham, spam]) } });

const loadService = async () => {
  vi.resetModules();
  const { SpamDetectorService } = await import('.');
  return new SpamDetectorService();
};

describe('SpamDetectorService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mocks.run.mockReset();
    mocks.createSession.mockReset().mockResolvedValue({ run: mocks.run });
    mocks.getVariable.mockReturnValue('https://models.example/spam.onnx');
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => ({
        text: async () => (url.endsWith('.json') ? '{\n   "a": 0,\n   "b": 1\n}' : 'a b\n'),
      })),
    );
    window.Module = vi.fn(async () => fakeTokenizer()) as unknown as Window['Module'];
    vi.spyOn(document.body, 'appendChild').mockImplementation((node) => {
      (node as HTMLScriptElement).onload?.(new Event('load'));
      return node;
    });
  });

  test('When the model scores the text as spam, then it should flag it with its probability', async () => {
    mocks.run.mockResolvedValue(scores(-1.5, 1.5));
    const service = await loadService();

    const prediction = await service.predict('You won a prize');

    expect(prediction.isSpam).toBe(true);
    expect(prediction.spamProbability).toBeCloseTo(0.953, 3);
  });

  test('When the model scores the text as legitimate, then it should not flag it', async () => {
    mocks.run.mockResolvedValue(scores(1.8, -1));
    const service = await loadService();

    const prediction = await service.predict('Meeting notes attached');

    expect(prediction.isSpam).toBe(false);
    expect(prediction.spamProbability).toBeLessThan(0.1);
  });

  test('When several texts are classified, then it should download the model only once', async () => {
    mocks.run.mockResolvedValue(scores(1, -1));
    const service = await loadService();

    await service.predict('first');
    await service.predict('second');

    expect(mocks.createSession).toHaveBeenCalledTimes(1);
    expect(mocks.createSession).toHaveBeenCalledWith('https://models.example/spam.onnx', expect.anything());
  });

  test('When the model fails to download, then it should try again on the next classification', async () => {
    mocks.createSession.mockRejectedValueOnce(new Error('network down'));
    mocks.run.mockResolvedValue(scores(1, -1));
    const service = await loadService();

    await expect(service.predict('first')).rejects.toThrow('network down');
    const prediction = await service.predict('second');

    expect(prediction.isSpam).toBe(false);
    expect(mocks.createSession).toHaveBeenCalledTimes(2);
  });
});
