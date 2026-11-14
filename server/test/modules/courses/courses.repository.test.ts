import type { Database } from "../../../src/database/connection";
import { PgCourseRepository } from "../../../src/modules/courses/courses.repository";

describe("PgCourseRepository", () => {
  let query: jest.Mock;
  let repository: PgCourseRepository;
  const sql = (value: string) => value.replace(/\s+/g, " ").trim();

  beforeEach(() => {
    query = jest.fn();
    repository = new PgCourseRepository({ query } as unknown as Database);
  });

  it("creates a course with parameterized SQL and returns its row", async () => {
    const course = { id: 7, name: "Qualidade" };
    query.mockResolvedValue({ rows: [course] });
    await expect(repository.create({ name: "Qualidade" })).resolves.toBe(course);
    expect(query).toHaveBeenCalledTimes(1);
    expect(sql(query.mock.calls[0][0])).toBe(
      "INSERT INTO courses (name) VALUES ($1) RETURNING id, name",
    );
    expect(query.mock.calls[0][1]).toEqual(["Qualidade"]);
  });

  it("lists courses ordered by id without query parameters", async () => {
    const courses = [{ id: 7, name: "Qualidade" }];
    query.mockResolvedValue({ rows: courses });
    await expect(repository.findAll()).resolves.toBe(courses);
    expect(query).toHaveBeenCalledTimes(1);
    expect(sql(query.mock.calls[0][0])).toBe("SELECT id, name FROM courses ORDER BY id");
    expect(query.mock.calls[0]).toHaveLength(1);
  });

  it("returns an empty list when no courses exist", async () => {
    query.mockResolvedValue({ rows: [] });
    await expect(repository.findAll()).resolves.toEqual([]);
  });

  it("finds a course by id and returns the first row", async () => {
    const course = { id: 7, name: "Qualidade" };
    query.mockResolvedValue({ rows: [course] });
    await expect(repository.findOne(7)).resolves.toBe(course);
    expect(query).toHaveBeenCalledTimes(1);
    expect(sql(query.mock.calls[0][0])).toBe("SELECT id, name FROM courses WHERE id = $1");
    expect(query.mock.calls[0][1]).toEqual([7]);
  });

  it("returns undefined when the course does not exist", async () => {
    query.mockResolvedValue({ rows: [] });
    await expect(repository.findOne(7)).resolves.toBeUndefined();
  });

  it.each(["create", "findAll", "findOne"] as const)(
    "propagates the original query error from %s",
    async (method) => {
      const failure = new Error("database unavailable");
      query.mockRejectedValue(failure);
      const operation = method === "create"
        ? repository.create({ name: "Qualidade" })
        : method === "findAll"
          ? repository.findAll()
          : repository.findOne(7);
      await expect(operation).rejects.toBe(failure);
    },
  );
});
