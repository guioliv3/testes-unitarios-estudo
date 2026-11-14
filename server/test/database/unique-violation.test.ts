import { isUniqueViolation } from "../../src/database/unique-violation";

it("recognizes PostgreSQL unique violation code", () => {
  expect(isUniqueViolation({ code: "23505" })).toBe(true);
});

test.each([null, undefined, "23505", 23503, {}, { code: "outro" }])(
  "does not recognize %p as a unique violation",
  (error) => expect(isUniqueViolation(error)).toBe(false),
);
