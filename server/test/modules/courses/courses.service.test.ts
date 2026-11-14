import { CoursesService } from "../../../src/modules/courses/courses.service";
import type {
  CourseRepository,
} from "../../../src/modules/courses/courses.repository";

describe("CoursesService", () => {
  let repository: jest.Mocked<CourseRepository>;
  let service: CoursesService;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
    };
    service = new CoursesService(repository);
  });

  it("creates a course and forwards validated fields", async () => {
    const course = { id: 1, name: "Qualidade" };
    repository.create.mockResolvedValue(course);
    await expect(service.create({ name: "Qualidade" })).resolves.toEqual(course);
    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(repository.create).toHaveBeenCalledWith({ name: "Qualidade" });
  });

  test.each([null, {}, { name: "A" }])(
    "rejects invalid course input %p with HTTP 400 before repository access",
    async (input) => {
      await expect(service.create(input)).rejects.toMatchObject({ statusCode: 400 });
      expect(repository.create).not.toHaveBeenCalled();
    },
  );

  it("translates duplicate course names to HTTP 409", async () => {
    repository.create.mockRejectedValue({ code: "23505" });
    await expect(service.create({ name: "Qualidade" })).rejects.toMatchObject({
      statusCode: 409,
    });
  });

  it("returns a stubbed course list", async () => {
    const courses = [{ id: 1, name: "Qualidade" }];
    repository.findAll.mockResolvedValue(courses);
    await expect(service.findAll()).resolves.toBe(courses);
    expect(repository.findAll).toHaveBeenCalledTimes(1);
  });

  it("returns an existing course and forwards its id", async () => {
    const course = { id: 123, name: "Qualidade" };
    repository.findOne.mockResolvedValue(course);
    await expect(service.findOne(123)).resolves.toBe(course);
    expect(repository.findOne).toHaveBeenCalledWith(123);
  });

  it("throws HTTP 404 when a course is absent", async () => {
    repository.findOne.mockResolvedValue(undefined);
    await expect(service.findOne(123)).rejects.toMatchObject({ statusCode: 404 });
  });

  it("rejects an invalid id before repository access", async () => {
    await expect(service.findOne(0)).rejects.toMatchObject({ statusCode: 400 });
    expect(repository.findOne).not.toHaveBeenCalled();
  });

  it.each(["create", "findAll", "findOne"] as const)(
    "propagates the original unexpected %s failure",
    async (method) => {
      const failure = new Error("database unavailable");
      repository[method].mockRejectedValue(failure);
      const operation = method === "create"
        ? service.create({ name: "Qualidade" })
        : method === "findAll"
          ? service.findAll()
          : service.findOne(1);
      await expect(operation).rejects.toBe(failure);
    },
  );

  it("uses a spy to observe findOne on an async stub", async () => {
    const existingRepository: CourseRepository = {
      create: jest.fn().mockResolvedValue({ id: 1, name: "Qualidade" }),
      findAll: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue({ id: 1, name: "Qualidade" }),
    };
    const spy = jest.spyOn(existingRepository, "findOne");
    const existingService = new CoursesService(existingRepository);
    const result = await existingService.findOne(1);
    expect(result).toEqual({ id: 1, name: "Qualidade" });
    expect(spy).toHaveBeenCalledWith(1);
  });

  it("removes extra fields before calling the repository", async () => {
    repository.create.mockResolvedValue({ id: 1, name: "Qualidade" });
    await service.create({ name: "Qualidade", extra: true });
    expect(repository.create).toHaveBeenCalledWith({ name: "Qualidade" });
  });
});
