import { GuruModelService } from "./guru-model.service";
import { GoogleGenerativeAI } from "@google/generative-ai";
jest.mock("@google/generative-ai", () => ({ GoogleGenerativeAI: jest.fn() }));
describe("Guru provider boundary", () => {
  const original = process.env;
  const originalFetch = global.fetch;
  let service: GuruModelService;
  const completed = (text: string) => ({
    ok: true,
    json: async () => ({
      status: "completed",
      output: [{ type: "message", content: [{ type: "output_text", text }] }],
    }),
  });
  beforeEach(() => {
    process.env = {
      ...original,
      GURU_PROVIDER: "openai",
      GURU_MODEL: "configured-vision-model",
      OPENAI_API_KEY: "test-only-secret",
    };
    service = new GuruModelService();
    global.fetch = jest.fn().mockResolvedValue(completed('{"readable":true}'));
  });
  afterEach(() => {
    process.env = original;
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });
  it("sends original image and JSON instructions only to the configured OpenAI endpoint", async () => {
    const image = "data:image/png;base64,aGVsbG8=";
    await expect(service.json("Read the page", image)).resolves.toEqual({
      readable: true,
    });
    const [url, options] = (fetch as jest.Mock).mock.calls[0];
    expect(url).toBe("https://api.openai.com/v1/responses");
    expect(options.redirect).toBe("error");
    expect(options.headers.Authorization).toBe("Bearer test-only-secret");
    const body = JSON.parse(options.body);
    expect(body.store).toBe(false);
    expect(body.max_output_tokens).toBe(48000);
    expect(body.text.format.type).toBe("json_object");
    expect(body.input[0].content[1]).toEqual({
      type: "input_image",
      image_url: image,
      detail: "high",
    });
    expect(service.identity).toBe("openai:configured-vision-model");
  });
  it("does not call any provider when the chosen key is missing", async () => {
    delete process.env.OPENAI_API_KEY;
    process.env.GEMINI_API_KEY = "available-but-not-selected";
    expect(service.configured).toBe(false);
    await expect(service.json("Read")).rejects.toThrow("Configure");
    expect(fetch).not.toHaveBeenCalled();
  });
  it("rejects remote image URLs before a provider request", async () => {
    await expect(
      service.json("Read", "https://private-host/page"),
    ).rejects.toThrow("Invalid source image");
    expect(fetch).not.toHaveBeenCalled();
  });
  it.each(["incomplete", "failed"])(
    "does not accept a %s response",
    async (status) => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ status, output: [] }),
      });
      await expect(service.json("Read")).rejects.toThrow("incomplete");
    },
  );
  it("handles refusal without treating it as a lesson", async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        status: "completed",
        output: [
          {
            type: "message",
            content: [{ type: "refusal", refusal: "declined" }],
          },
        ],
      }),
    });
    await expect(service.json("Read")).rejects.toThrow("could not answer");
  });
  it.each(["not JSON", "[]", "null"])(
    "rejects invalid object output %s",
    async (raw) => {
      (fetch as jest.Mock).mockResolvedValue(completed(raw));
      await expect(service.json("Read")).rejects.toThrow("valid response");
    },
  );
  it("does not expose raw provider errors or retry paid requests", async () => {
    (fetch as jest.Mock).mockRejectedValue(new Error("test-only-secret"));
    await expect(service.json("Read")).rejects.toThrow("valid response");
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("retries a rate limit a bounded number of times, then reports it", async () => {
    process.env.GURU_RETRY_WAITS_MS = "0,0";
    (fetch as jest.Mock).mockResolvedValue({ ok: false, status: 429 });
    await expect(service.json("Read")).rejects.toThrow("API limit");
    expect(fetch).toHaveBeenCalledTimes(3);
    delete process.env.GURU_RETRY_WAITS_MS;
  });
  it("does not retry a daily quota violation and names it", async () => {
    process.env.GURU_RETRY_WAITS_MS = "0,0";
    (fetch as jest.Mock).mockRejectedValue(
      new Error(
        "[429 Too Many Requests] You exceeded your current quota. quotaId: GenerateRequestsPerDayPerProjectPerModel-FreeTier",
      ),
    );
    await expect(service.json("Read")).rejects.toThrow("daily provider quota");
    expect(fetch).toHaveBeenCalledTimes(1);
    delete process.env.GURU_RETRY_WAITS_MS;
  });
  it("recovers when a transient error clears on retry", async () => {
    process.env.GURU_RETRY_WAITS_MS = "0";
    (fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: "completed",
          output: [{ type: "message", content: [{ type: "output_text", text: '{"ok":true}' }] }],
        }),
      });
    await expect(service.json("Read")).resolves.toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledTimes(2);
    delete process.env.GURU_RETRY_WAITS_MS;
  });
  it("preserves Gemini when no provider override is supplied", async () => {
    delete process.env.GURU_PROVIDER;
    process.env.GEMINI_API_KEY = "gemini-test-key";
    const generateContent = jest
      .fn()
      .mockResolvedValue({ response: { text: () => '{"readable":true}' } });
    (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
      getGenerativeModel: () => ({ generateContent }),
    }));
    await expect(service.json("Read")).resolves.toEqual({ readable: true });
    expect(generateContent).toHaveBeenCalledTimes(1);
    expect(fetch).not.toHaveBeenCalled();
    expect(service.identity).toBe("gemini:configured-vision-model");
  });
});
