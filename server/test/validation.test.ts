import { HttpError } from "../src/errors";
import {
  parseId,
  positiveInteger,
  validateBody,
  validateName,
} from "../src/validation";

describe("positiveInteger", () => {
  test.each([1, 2147483647])("returns valid boundary %s", (value) => {
    expect(positiveInteger(value, "RA")).toBe(value);
  });

  test.each([0, -1, 1.5, NaN, Infinity, 2147483648, "123", null, undefined])(
    "rejects invalid value %p with HTTP 400",
    (value) => {
      expect(() => positiveInteger(value, "RA")).toThrow(HttpError);
      try {
        positiveInteger(value, "RA");
      } catch (error) {
        expect(error).toBeInstanceOf(HttpError);
        expect((error as HttpError).statusCode).toBe(400);
      }
    },
  );
});

describe("parseId", () => {
  test.each([["1", 1], ["2147483647", 2147483647]])(
    "parses %s as %i",
    (value, expected) => expect(parseId(value, "RA")).toBe(expected),
  );

  test.each(["1abc", "1.2", "1e2", "", "-1", "0", "2147483648", 123])(
    "rejects invalid identifier %p with HTTP 400",
    (value) => {
      expect(() => parseId(value, "RA")).toThrow(HttpError);
      try {
        parseId(value, "RA");
      } catch (error) {
        expect((error as HttpError).statusCode).toBe(400);
      }
    },
  );
});

describe("validateName", () => {
  test.each(["Ana", "a".repeat(100)])("accepts valid name", (value) => {
    expect(validateName(value)).toBe(value);
  });

  test.each(["", "ab", "   ", " a ", "a".repeat(101), 123, null, undefined])(
    "rejects invalid name %p with HTTP 400",
    (value) => {
      expect(() => validateName(value)).toThrow(HttpError);
      try {
        validateName(value);
      } catch (error) {
        expect((error as HttpError).statusCode).toBe(400);
      }
    },
  );
});

describe("validateBody", () => {
  it("returns a frozen valid object unchanged", () => {
    const body = Object.freeze({ name: "Ana" });
    expect(validateBody(body)).toBe(body);
    expect(body).toEqual({ name: "Ana" });
  });

  test.each([null, undefined, [], "Ana", 12])(
    "rejects non-object body %p with HTTP 400",
    (value) => {
      expect(() => validateBody(value)).toThrow(HttpError);
      try {
        validateBody(value);
      } catch (error) {
        expect((error as HttpError).statusCode).toBe(400);
      }
    },
  );

  it("accepts and preserves extra fields", () => {
    const body = { name: "Ana", extra: true };
    expect(validateBody(body)).toBe(body);
    expect(body).toEqual({ name: "Ana", extra: true });
  });
});
