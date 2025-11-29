import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('discount_codes')
export class DiscountCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column({ default: false })
  isUsed: boolean;

  @Column({ nullable: true, type: 'uuid' })
  usedBy: string; // userId who used the code

  @Column({ nullable: true })
  usedAt: Date;

  @Column('uuid')
  orderId: string; // Order that generated this code

  @CreateDateColumn()
  createdAt: Date;
}

