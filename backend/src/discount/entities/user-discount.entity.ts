import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Discount } from './discount.entity';

@Entity('user_discounts')
@Unique(['userId', 'discountId'])
export class UserDiscount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column('uuid')
  discountId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Discount)
  @JoinColumn({ name: 'discountId' })
  discount: Discount;

  @Column({ default: false })
  isUsed: boolean;

  @Column({ nullable: true, type: 'timestamp' })
  usedAt: Date | null;

  @Column({ nullable: true, type: 'uuid' })
  orderId: string | null; // Order where this discount was used

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

