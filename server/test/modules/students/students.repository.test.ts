import type { Database } from "../../../src/database/connection";
import { PgStudentRepository } from "../../../src/modules/students/students.repository";

describe("PgStudentRepository", () => {
  let query: jest.Mock;
  let repository: PgStudentRepository;
  const sql = (value: string) => value.replace(/\s+/g, " ").trim();

  beforeEach(() => {
    query = jest.fn();
    repository = new PgStudentRepository({ query } as unknown as Database);
  });

  it("creates a student with parameterized SQL and returns its row", async () => {
    const student = { ra: 123, name: "Ana" };
    query.mockResolvedValue({ rows: [student] });
    await expect(repository.create(student)).resolves.toBe(student);
    expect(query).toHaveBeenCalledTimes(1);
    expect(sql(query.mock.calls[0][0])).toBe(
      "INSERT INTO students (ra, name) VALUES ($1, $2) RETURNING ra, name",
    );
    expect(query.mock.calls[0][1]).toEqual([123, "Ana"]);
  });

  it("lists students ordered by name without query parameters", async () => {
    const students = [{ ra: 123, name: "Ana" }];
    query.mockResolvedValue({ rows: students });
    await expect(repository.findAll()).resolves.toBe(students);
    expect(query).toHaveBeenCalledTimes(1);
    expect(sql(query.mock.calls[0][0])).toBe(
      "SELECT ra, name FROM students ORDER BY name",
    );
    expect(query.mock.calls[0]).toHaveLength(1);
  });

  it("returns an empty list when no students exist", async () => {
    query.mockResolvedValue({ rows: [] });
    await expect(repository.findAll()).resolves.toEqual([]);
  });

  it("finds a student by RA and returns the first row", async () => {
    const student = { ra: 123, name: "Ana" };
    query.mockResolvedValue({ rows: [student] });
    await expect(repository.findOne(123)).resolves.toBe(student);
    expect(query).toHaveBeenCalledTimes(1);
    expect(sql(query.mock.calls[0][0])).toBe("SELECT ra, name FROM students WHERE ra = $1");
    expect(query.mock.calls[0][1]).toEqual([123]);
  });

  it("returns undefined when the student does not exist", async () => {
    query.mockResolvedValue({ rows: [] });
    await expect(repository.findOne(123)).resolves.toBeUndefined();
  });

  it.each(["create", "findAll", "findOne"] as const)(
    "propagates the original query error from %s",
    async (method) => {
      const failure = new Error("database unavailable");
      query.mockRejectedValue(failure);
      const operation = method === "create"
        ? repository.create({ ra: 123, name: "Ana" })
        : method === "findAll"
          ? repository.findAll()
          : repository.findOne(123);
      await expect(operation).rejects.toBe(failure);
    },
  );
});
