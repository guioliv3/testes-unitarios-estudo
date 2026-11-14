import { isForeignKeyViolation } from "../../src/database/foreign-key-violation";

it("recognizes PostgreSQL foreign-key violation code", () => {
  expect(isForeignKeyViolation({ code: "23503" })).toBe(true);
});

test.each([null, undefined, "23505", 23503, {}, { code: "outro" }])(
  "does not recognize %p as a foreign-key violation",
  (error) => expect(isForeignKeyViolation(error)).toBe(false),
);
