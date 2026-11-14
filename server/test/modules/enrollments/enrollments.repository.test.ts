import type { Database } from "../../../src/database/connection";
import { PgEnrollmentRepository } from "../../../src/modules/enrollments/enrollments.repository";

describe("PgEnrollmentRepository", () => {
  let query: jest.Mock;
  let repository: PgEnrollmentRepository;
  const sql = (value: string) => value.replace(/\s+/g, " ").trim();
  const expectedColumns =
    'student_ra AS "studentRa", course_id AS "courseId", enrolled_at AS "enrolledAt"';
  const enrollment = {
    studentRa: 123,
    courseId: 7,
    enrolledAt: new Date("2025-01-01T00:00:00.000Z"),
  };

  beforeEach(() => {
    query = jest.fn();
    repository = new PgEnrollmentRepository({ query } as unknown as Database);
  });

  it("creates an enrollment with aliases and ordered parameters", async () => {
    query.mockResolvedValue({ rows: [enrollment] });
    const result = await repository.create(123, 7);
    expect(result).toEqual(enrollment);
    expect(result).toHaveProperty("studentRa", 123);
    expect(result).toHaveProperty("courseId", 7);
    expect(result?.enrolledAt).toBe(enrollment.enrolledAt);
    expect(query).toHaveBeenCalledTimes(1);
    expect(sql(query.mock.calls[0][0])).toBe(
      `INSERT INTO enrollments (student_ra, course_id) VALUES ($1, $2) RETURNING ${expectedColumns}`,
    );
    expect(query.mock.calls[0][1]).toEqual([123, 7]);
  });

  it("lists enrollments in key order without query parameters", async () => {
    query.mockResolvedValue({ rows: [enrollment] });
    await expect(repository.findAll()).resolves.toEqual([enrollment]);
    expect(query).toHaveBeenCalledTimes(1);
    expect(sql(query.mock.calls[0][0])).toBe(
      `SELECT ${expectedColumns} FROM enrollments ORDER BY student_ra, course_id`,
    );
    expect(query.mock.calls[0]).toHaveLength(1);
  });

  it("returns an empty list when no enrollments exist", async () => {
    query.mockResolvedValue({ rows: [] });
    await expect(repository.findAll()).resolves.toEqual([]);
  });

  it("finds an enrollment by both keys and returns the first row", async () => {
    query.mockResolvedValue({ rows: [enrollment] });
    await expect(repository.findOne(123, 7)).resolves.toBe(enrollment);
    expect(query).toHaveBeenCalledTimes(1);
    expect(sql(query.mock.calls[0][0])).toBe(
      `SELECT ${expectedColumns} FROM enrollments WHERE student_ra = $1 AND course_id = $2`,
    );
    expect(query.mock.calls[0][1]).toEqual([123, 7]);
  });

  it("returns undefined when the enrollment does not exist", async () => {
    query.mockResolvedValue({ rows: [] });
    await expect(repository.findOne(123, 7)).resolves.toBeUndefined();
  });

  it.each(["create", "findAll", "findOne"] as const)(
    "propagates the original query error from %s",
    async (method) => {
      const failure = new Error("database unavailable");
      query.mockRejectedValue(failure);
      const operation = method === "create"
        ? repository.create(123, 7)
        : method === "findAll"
          ? repository.findAll()
          : repository.findOne(123, 7);
      await expect(operation).rejects.toBe(failure);
    },
  );
});
