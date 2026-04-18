import { HttpException, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import * as bcrypt from 'bcryptjs'
import { Repository } from 'typeorm'

import { UserEntity } from '../../entities/user.entity'

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(UserEntity)
        private readonly userRepository: Repository<UserEntity>
    ) {}

    async validateUser(username: string, pass: string): Promise<any> {
        const user = await this.userRepository.findOne({
            where: { username },
        })
        if (user && (await bcrypt.compare(pass, user.password))) {
            const { password, ...result } = user
            return result
        }
        return null
    }

    async findOne(id: number): Promise<any> {
        const user = await this.userRepository.findOne({
            where: { id },
        })
        if (user) {
            const { password, ...result } = user
            return result
        }
        return null
    }

    async register(body: { username: string; password: string }) {
        const userIsExist = await this.userRepository.findOne({
            where: { username: body.username },
        })
        if (userIsExist) {
            throw new HttpException({ message: '用户已存在', error: 'user is existed' }, 400)
        }
        const hashedPassword = await bcrypt.hash(body.password, 10)
        const user = this.userRepository.create({
            username: body.username,
            password: hashedPassword,
        })
        await this.userRepository.save(user)
        const { password: _, ...result } = user
        return result
    }
}
