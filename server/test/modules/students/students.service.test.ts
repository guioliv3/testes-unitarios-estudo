import { StudentsService } from "../../../src/modules/students/students.service";
import type { StudentRepository } from "../../../src/modules/students/students.repository";

describe("StudentsService", () => {
  let repository: jest.Mocked<StudentRepository>;
  let service: StudentsService;

  beforeEach(() => {
    repository = { create: jest.fn(), findAll: jest.fn(), findOne: jest.fn() };
    service = new StudentsService(repository);
  });

  it("creates a student and forwards validated fields", async () => {
    const student = { ra: 123, name: "Ana" };
    repository.create.mockResolvedValue(student);
    await expect(service.create(student)).resolves.toBe(student);
    expect(repository.create).toHaveBeenCalledWith(student);
  });

  it("rejects an invalid RA with HTTP 400 before repository access", async () => {
    await expect(service.create({ ra: 0, name: "Ana" })).rejects.toMatchObject({
      statusCode: 400,
    });
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("translates duplicate RAs to HTTP 409", async () => {
    repository.create.mockRejectedValue({ code: "23505" });
    await expect(service.create({ ra: 123, name: "Ana" })).rejects.toMatchObject({
      statusCode: 409,
    });
  });

  it("throws HTTP 404 when a student is absent", async () => {
    repository.findOne.mockResolvedValue(undefined);
    await expect(service.findOne(123)).rejects.toMatchObject({ statusCode: 404 });
  });

  it("propagates the original unexpected create failure", async () => {
    const failure = new Error("database unavailable");
    repository.create.mockRejectedValue(failure);
    await expect(service.create({ ra: 123, name: "Ana" })).rejects.toBe(failure);
  });

  it("returns all students and calls findAll once without arguments", async () => {
    const students = [{ ra: 123, name: "Ana" }];
    repository.findAll.mockResolvedValue(students);
    await expect(service.findAll()).resolves.toBe(students);
    expect(repository.findAll).toHaveBeenCalledTimes(1);
    expect(repository.findAll).toHaveBeenCalledWith();
  });

  it("returns an existing student and forwards its RA", async () => {
    const student = { ra: 123, name: "Ana" };
    repository.findOne.mockResolvedValue(student);
    await expect(service.findOne(123)).resolves.toBe(student);
    expect(repository.findOne).toHaveBeenCalledTimes(1);
    expect(repository.findOne).toHaveBeenCalledWith(123);
  });
});
