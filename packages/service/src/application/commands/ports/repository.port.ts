export interface RepositoryPort<MODEL, PK = string> {
  save(model: MODEL): Promise<MODEL>;
  findById(id: PK): Promise<MODEL | undefined>;
}
