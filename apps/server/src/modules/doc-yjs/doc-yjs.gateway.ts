import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { HttpAdapterHost } from '@nestjs/core'
import { InjectRepository } from '@nestjs/typeorm'
import * as jwt from 'jsonwebtoken'
import { Server } from 'ws'
import { Repository } from 'typeorm'

import { CollaboratorEntity } from '../../entities/collaborator.entity'
import { PageEntity } from '../../entities/page.entity'
import { docs, setupWSConnection } from '../../fundamentals/yjs-postgresql/utils'
import { ShareService } from '../share/share.service'

const MAX_CONNECTIONS_PER_DOC = 50

@Injectable()
export class DocYjsGateway implements OnModuleInit {
    private wss: Server

    constructor(
        private readonly httpAdapterHost: HttpAdapterHost,
        private readonly shareService: ShareService,
        private readonly configService: ConfigService,
        @InjectRepository(PageEntity)
        private readonly pageRepository: Repository<PageEntity>,
        @InjectRepository(CollaboratorEntity)
        private readonly collaboratorRepository: Repository<CollaboratorEntity>,
    ) {}

    onModuleInit() {
        this.wss = new Server({ noServer: true })

        this.wss.on('connection', (connection: WebSocket, request: any) => {
            const url = new URL(request.url, `http://${request.headers.host}`)
            const docName = url.pathname.slice(1).split('?')[0]

            if (!docName.startsWith('doc-yjs-')) {
                Logger.warn(`WebSocket connection rejected: invalid docName "${docName}"`)
                connection.close(4002, 'Invalid document path')
                return
            }

            const token = url.searchParams.get('token')
            const shareId = url.searchParams.get('shareId')
            const pageId = docName.replace('doc-yjs-', '')

            if (token) {
                try {
                    const secret = this.configService.get<string>('JWT_SECRET') || 'dev-secret-key-change-in-production'
                    const payload: any = jwt.verify(token, secret)
                    const userId = payload.sub

                    this.pageRepository.findOne({
                        where: { pageId, isDeleted: false },
                        relations: ['user'],
                    }).then(page => {
                        if (!page) {
                            connection.close(4004, 'Page not found')
                            return
                        }
                        if (page.user.id === userId) {
                            const existingDoc = docs.get(docName)
                            if (existingDoc && existingDoc.conns.size >= MAX_CONNECTIONS_PER_DOC) {
                                setupWSConnection(connection, request, { docName, readOnly: true })
                                Logger.warn(`Doc ${pageId} reached max connections (${MAX_CONNECTIONS_PER_DOC}), connecting as observer`)
                            } else {
                                setupWSConnection(connection, request, { docName })
                            }
                            return
                        }
                        this.collaboratorRepository.findOne({
                            where: { pageId, userId },
                        }).then(collab => {
                            if (!collab) {
                                connection.close(4003, 'No access')
                                return
                            }
                            const readOnly = collab.role === 'viewer' || collab.role === 'commenter'
                            const existingDoc = docs.get(docName)
                            if (!readOnly && existingDoc && existingDoc.conns.size >= MAX_CONNECTIONS_PER_DOC) {
                                setupWSConnection(connection, request, { docName, readOnly: true })
                                Logger.warn(`Doc ${pageId} reached max connections, connecting editor as observer`)
                            } else {
                                setupWSConnection(connection, request, { docName, readOnly })
                            }
                        }).catch(() => {
                            connection.close(4003, 'No access')
                        })
                    }).catch(() => {
                        connection.close(4004, 'Page not found')
                    })
                    return
                } catch {
                    Logger.warn('WebSocket connection rejected: invalid token')
                    connection.close(4001, 'Invalid token')
                    return
                }
            } else if (shareId) {
                const password = url.searchParams.get('password') || undefined
                this.shareService
                    .access({ shareId, password })
                    .then((shareInfo: any) => {
                        const readOnly = shareInfo.permission !== 'edit'
                        setupWSConnection(connection, request, { docName, readOnly })
                    })
                    .catch(() => {
                        Logger.warn('WebSocket connection rejected: invalid share link')
                        connection.close(4001, 'Invalid share link')
                    })
                connection.addEventListener('close', () => {
                    Logger.log('Client disconnected')
                })
                return
            } else {
                Logger.warn('WebSocket connection rejected: no token or shareId provided')
                connection.close(4001, 'Authentication required')
                return
            }
        })

        const httpServer = this.httpAdapterHost.httpAdapter.getHttpServer()

        httpServer.on('upgrade', (request: any, socket: any, head: any) => {
            const pathname = new URL(request.url, `http://${request.headers.host}`).pathname

            if (pathname.startsWith('/doc-yjs-')) {
                this.wss.handleUpgrade(request, socket, head, (ws) => {
                    this.wss.emit('connection', ws, request)
                })
            } else {
                socket.destroy()
            }
        })
    }
}
