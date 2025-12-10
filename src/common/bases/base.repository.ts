// base.repository.ts
import { Repository, FindOptionsWhere, DeepPartial, FindManyOptions, ObjectLiteral } from "typeorm";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";

export class BaseRepository<T extends ObjectLiteral> {
    constructor(protected readonly repository: Repository<T>) { }

    async findOneById(id: string | number, idField: keyof T = 'id' as keyof T): Promise<T | null> {
        return this.repository.findOne({
            where: { [idField]: id } as FindOptionsWhere<T>
        }) ?? null;
    }

    async findAll(options?: FindManyOptions<T>): Promise<T[]> {
        return this.repository.find(options);
    }

    async findByCondition(
        filterCondition: FindOptionsWhere<T>,
        options?: Omit<FindManyOptions<T>, 'where'>
    ): Promise<T | null> {
        return this.repository.findOne({
            where: filterCondition,
            ...options
        }) ?? null;
    }

    async findAllByCondition(
        filterCondition: FindOptionsWhere<T>,
        options?: Omit<FindManyOptions<T>, 'where'>
    ): Promise<T[]> {
        return this.repository.find({
            where: filterCondition,
            ...options
        });
    }

    async create(data: DeepPartial<T>): Promise<T> {
        const entity = this.repository.create(data);
        return this.repository.save(entity);
    }

    async createMany(data: DeepPartial<T>[]): Promise<T[]> {
        const entities = this.repository.create(data);
        return this.repository.save(entities);
    }

    async update(
        id: string | number,
        data: QueryDeepPartialEntity<T>,
        idField: keyof T = 'id' as keyof T
    ): Promise<boolean> {
        const result = await this.repository.update(
            { [idField]: id } as FindOptionsWhere<T>,
            data
        );
        return (result.affected ?? 0) > 0;
    }

    async remove(id: string | number, idField: keyof T = 'id' as keyof T): Promise<boolean> {
        const result = await this.repository.delete(
            { [idField]: id } as FindOptionsWhere<T>
        );
        return (result.affected ?? 0) > 0;
    }

    async exists(filterCondition: FindOptionsWhere<T>): Promise<boolean> {
        const count = await this.repository.count({ where: filterCondition });
        return count > 0;
    }

    async count(filterCondition?: FindOptionsWhere<T>): Promise<number> {
        return this.repository.count({ where: filterCondition });
    }
}