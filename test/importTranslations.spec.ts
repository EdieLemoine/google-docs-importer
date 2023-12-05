import {
  vi,
  describe,
  it,
  beforeEach,
  expect,
  afterAll,
  type SpyInstance,
} from "vitest";
import fs from "fs";
import { Stream } from "stream";
import { importTranslations } from "../src";
import * as asyncGet from "../src/utils/asyncGet";
import { createMockContext } from "./createMockContext";

let stream: Stream;

const getMock = vi.spyOn(asyncGet, "asyncGet");

describe("import", () => {
  let mkdirSpy: SpyInstance;
  let writeFileSpy: SpyInstance;

  beforeEach(() => {
    stream = new Stream();

    mkdirSpy = vi.spyOn(fs.promises, "mkdir").mockImplementation(() => {
      return Promise.resolve("");
    });

    writeFileSpy = vi.spyOn(fs.promises, "writeFile").mockImplementation(() => {
      return Promise.resolve();
    });

    getMock.mockImplementation(() => Promise.resolve(""));
  });

  afterAll(() => {
    vi.resetAllMocks();
  });

  it("imports correctly", async () => {
    expect.assertions(5);
    getMock.mockResolvedValue("key,nl_NL,en_GB\nmy_translation,woord,word\n");

    await importTranslations(createMockContext());

    expect(mkdirSpy).toHaveBeenCalledTimes(2);
    expect(mkdirSpy).toHaveBeenCalledWith("/dist/", { recursive: true });
    expect(writeFileSpy).toHaveBeenCalledTimes(2);
    expect(writeFileSpy).toHaveBeenNthCalledWith(
      1,
      "/dist/nl_NL.json",
      JSON.stringify({ my_translation: "woord", lang: "nl_NL" }, null, 2) +
        "\n",
      { encoding: "utf-8" },
    );

    expect(writeFileSpy).toHaveBeenNthCalledWith(
      2,
      "/dist/en_GB.json",
      JSON.stringify({ my_translation: "word", lang: "en_GB" }, null, 2) + "\n",
      { encoding: "utf-8" },
    );
  });

  it("throws error if sheet data is invalid", async () => {
    expect.assertions(1);
    await expect(() => {
      return importTranslations(createMockContext({ documentId: undefined }));
    }).rejects.toBeInstanceOf(Error);
  });

  it("throws error if fetching sheet was not successful", async () => {
    expect.assertions(1);
    await expect(async () => {
      await importTranslations(createMockContext());
      stream.emit("data", '<html lang="en"></html>');
      stream.emit("end");
    }).rejects.toBeInstanceOf(Error);
  });

  it("throws error if sheet does not contain translations", async () => {
    expect.assertions(1);
    await expect(async () => {
      await importTranslations(createMockContext());
      stream.emit("data", "");
      stream.emit("end");
    }).rejects.toBeInstanceOf(Error);
  });
});
