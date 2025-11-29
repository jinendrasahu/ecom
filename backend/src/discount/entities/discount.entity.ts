import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserDiscount } from './user-discount.entity';

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

export enum DiscountConditionType {
  ORDER_COUNT = 'order_count', // User who purchased X orders
  MINIMUM_SPEND = 'minimum_spend', // User with minimum X amount spent
  FIRST_ORDER = 'first_order', // First time customer
  CUSTOM = 'custom', // Custom condition
}

@Entity('discounts')
export class Discount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({ unique: true })
  code: string;

  @Column({
    type: 'enum',
    enum: DiscountType,
    default: DiscountType.PERCENTAGE,
  })
  type: DiscountType; // 'percentage' or 'fixed'

  @Column('decimal', { precision: 10, scale: 2 })
  value: number; // Percentage (0-100) or fixed amount

  @Column({
    type: 'enum',
    enum: DiscountConditionType,
    nullable: true,
  })
  conditionType: DiscountConditionType | null;

  @Column('json', { nullable: true })
  conditionValue: any; // e.g., { orderCount: 3 } or { minimumSpend: 100 }

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date | null;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isGlobal: boolean; // If true, applies to all users, if false, only to specific users via UserDiscount

  @Column({ default: false })
  isListedToUser: boolean; // Toggle to show discount in checkout listing

  @OneToMany(() => UserDiscount, (userDiscount) => userDiscount.discount)
  userDiscounts: UserDiscount[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

