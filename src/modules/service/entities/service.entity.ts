
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
  } from 'typeorm';
  
  import { Business } from '../../business/entities/business.entity';
import { entityName } from 'src/common/enums/entityName.enum';
  
  @Entity(entityName.Service)
  export class Service {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({
      type: 'varchar',
      length: 150,
    })
    name: string;
  
    @Column({
      type: 'text',
      nullable: true,
    })
    description: string | null;
  
    @Column({
      type: 'int',
    })
    duration: number;
  
    @Column({
      type: 'decimal',
      precision: 12,
      scale: 2,
      default: 0,
    })
    price: number;
  
    @Column({
      type: 'boolean',
      default: true,
    })
    isActive: boolean;
  
    @ManyToOne(() => Business, {
      nullable: false,
      onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'businessId' })
    business: Business;
  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;
  }
  