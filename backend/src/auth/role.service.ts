import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  async findByName(name: string): Promise<Role | null> {
    return this.roleRepository.findOne({ where: { name } });
  }

  async findOrCreate(name: string, description?: string): Promise<Role> {
    let role = await this.roleRepository.findOne({ where: { name } });

    if (!role) {
      role = this.roleRepository.create({ name, description });
      role = await this.roleRepository.save(role);
    }

    return role;
  }

  async findAll(): Promise<Role[]> {
    return this.roleRepository.find();
  }
}

