import { EnrollmentsService } from "../../../src/modules/enrollments/enrollments.service";
import type { EnrollmentRepository } from "../../../src/modules/enrollments/enrollments.repository";

describe("EnrollmentsService", () => {
  let repository: jest.Mocked<EnrollmentRepository>;
  let service: EnrollmentsService;

  beforeEach(() => {
    repository = { create: jest.fn(), findAll: jest.fn(), findOne: jest.fn() };
    service = new EnrollmentsService(repository);
  });

  it("creates an enrollment and forwards identifiers in order", async () => {
    const enrollment = {
      studentRa: 123,
      courseId: 1,
      enrolledAt: new Date("2025-01-01T00:00:00.000Z"),
    };
    repository.create.mockResolvedValue(enrollment);
    await expect(service.create({ studentRa: 123, courseId: 1 })).resolves.toBe(enrollment);
    expect(repository.create).toHaveBeenCalledWith(123, 1);
  });

  test.each([
    [{ studentRa: 0, courseId: 1 }, "invalid student RA"],
    [{ studentRa: 123, courseId: 0 }, "invalid course id"],
  ])("rejects %s with HTTP 400 before repository access", async (input) => {
    await expect(service.create(input)).rejects.toMatchObject({ statusCode: 400 });
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("translates missing foreign-key references to HTTP 404", async () => {
    repository.create.mockRejectedValue({ code: "23503" });
    await expect(service.create({ studentRa: 123, courseId: 1 })).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it("translates duplicate enrollment to HTTP 409", async () => {
    repository.create.mockRejectedValue({ code: "23505" });
    await expect(service.create({ studentRa: 123, courseId: 1 })).rejects.toMatchObject({
      statusCode: 409,
    });
  });

  it("throws HTTP 404 for an absent enrollment and forwards both keys", async () => {
    repository.findOne.mockResolvedValue(undefined);
    await expect(service.findOne(123, 1)).rejects.toMatchObject({ statusCode: 404 });
    expect(repository.findOne).toHaveBeenCalledWith(123, 1);
  });

  it("propagates the original unexpected create failure", async () => {
    const failure = new Error("database unavailable");
    repository.create.mockRejectedValue(failure);
    await expect(service.create({ studentRa: 123, courseId: 1 })).rejects.toBe(failure);
  });

  it("returns all enrollments and calls findAll once without arguments", async () => {
    const enrollments = [{
      studentRa: 123,
      courseId: 1,
      enrolledAt: new Date("2025-01-01T00:00:00.000Z"),
    }];
    repository.findAll.mockResolvedValue(enrollments);
    await expect(service.findAll()).resolves.toBe(enrollments);
    expect(repository.findAll).toHaveBeenCalledTimes(1);
    expect(repository.findAll).toHaveBeenCalledWith();
  });

  it("returns an existing enrollment and forwards both keys in order", async () => {
    const enrollment = {
      studentRa: 123,
      courseId: 1,
      enrolledAt: new Date("2025-01-01T00:00:00.000Z"),
    };
    repository.findOne.mockResolvedValue(enrollment);
    await expect(service.findOne(123, 1)).resolves.toBe(enrollment);
    expect(repository.findOne).toHaveBeenCalledTimes(1);
    expect(repository.findOne).toHaveBeenCalledWith(123, 1);
  });
});
