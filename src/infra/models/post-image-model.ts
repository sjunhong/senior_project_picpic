import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Column,
  JoinColumn,
  OneToMany,
} from 'typeorm'
import { PostModel } from './post-model'
import { VoteModel } from './vote-model'

@Entity('post_images', { schema: 'app-db' })
export class PostImageModel {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('varchar', {
    name: 'post_id',
    nullable: false,
    comment: 'post id',
    length: 200,
  })
  postId: string

  @ManyToOne(() => PostModel, (post) => post.images, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'post_id' })
  post: PostModel

  @OneToMany(() => VoteModel, (vote) => vote.postImage, {
    cascade: true,
  })
  vote: VoteModel

  // varaibale for voted count
  pickedNum: number

  // variable for category count
  emotion: number

  // variable for category count
  color: number

  // variable for category count
  composition: number

  // variable for category count
  light: number

  // variable for category count
  skip: number

  @Column('varchar', {
    name: 'original_name',
    nullable: false,
    comment: 'original file name',
    length: 200,
  })
  originalName: string

  @Column('varchar', {
    name: 'image_url',
    comment: 'original image url',
    nullable: false,
    length: 200,
  })
  imageUrl: string

  @Column('varchar', {
    name: 'thumbnail_url',
    comment: 'thumbnail image url',
    nullable: false,
    length: 200,
  })
  thumbnailUrl: string

  @Column('boolean', {
    name: 'is_firstpick',
    comment: 'firstpick flag',
    default: false,
  })
  isFirstPick: boolean

  @Column('int', {
    name: 'image_index',
    comment: 'index of image in the post',
    default: false,
  })
  imageIndex: number

  @Column('varchar', {
    name: 'extension',
    nullable: false,
    comment: 'file extension',
    length: 50,
  })
  extension: string

  @Column('int', {
    name: 'width',
    comment: 'file width',
    default: null,
  })
  width: number

  @Column('int', {
    name: 'height',
    comment: 'file height',
    default: null,
  })
  height: number

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    comment: 'created date',
  })
  createdAt: Date

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
    comment: 'updated date',
  })
  updatedAt!: Date
}
