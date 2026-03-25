export interface IRepository<T, CreateInput, UpdateInput> {
  findById(id: string, organizationId: string): Promise<T | null>
  findAll(organizationId: string): Promise<T[]>
  create(data: CreateInput, organizationId: string): Promise<T>
  update(id: string, data: UpdateInput, organizationId: string): Promise<T>
  delete(id: string, organizationId: string): Promise<void>
}
