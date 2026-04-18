import { Logger } from '@nestjs/common'
import * as decoding from 'lib0/decoding'
import * as encoding from 'lib0/encoding'
import * as map from 'lib0/map'
import * as awarenessProtocol from 'y-protocols/awareness'
import * as syncProtocol from 'y-protocols/sync'
import * as Y from 'yjs'

import { IPersistence, IWSSharedDoc } from './types'

const wsReadyStateConnecting = 0
const wsReadyStateOpen = 1
const wsReadyStateClosing = 2 // eslint-disable-line
const wsReadyStateClosed = 3 // eslint-disable-line

// disable gc when using snapshots!
const gcEnabled = process.env.GC !== 'false' && process.env.GC !== '0'

let persistence: IPersistence | null = null

export const setPersistence = (persistence_: IPersistence) => {
    persistence = persistence_
}

export const getPersistence = () => persistence

// exporting docs so that others can use it
export const docs = new Map<string, IWSSharedDoc>()

const messageSync = 0
const messageAwareness = 1

const syncMessageType = {
    syncStep1: 0,
    syncStep2: 1,
    update: 2,
}

const updateHandler = (update: Uint8Array, origin: any, doc: Y.Doc) => {
    const sharedDoc = doc as IWSSharedDoc

    const encoder = encoding.createEncoder()
    encoding.writeVarUint(encoder, messageSync)
    syncProtocol.writeUpdate(encoder, update)
    const message = encoding.toUint8Array(encoder)
    sharedDoc.conns.forEach((_, conn) => send(sharedDoc, conn, message))
}

class WSSharedDoc extends Y.Doc implements IWSSharedDoc {
    name: string
    conns: Map<object, Set<number>>
    awareness: awarenessProtocol.Awareness

    constructor(name: string) {
        super({ gc: gcEnabled })
        this.name = name
        this.conns = new Map()
        this.awareness = new awarenessProtocol.Awareness(this)
        this.awareness.setLocalState(null)

        const awarenessChangeHandler = (
            {
                added,
                updated,
                removed,
            }: {
                added: Array<number>
                updated: Array<number>
                removed: Array<number>
            },
            conn: object | null
        ) => {
            const changedClients = added.concat(updated, removed)
            if (conn !== null) {
                const connControlledIDs = /** @type {Set<number>} */ this.conns.get(conn)
                if (connControlledIDs !== undefined) {
                    added.forEach(clientID => {
                        connControlledIDs.add(clientID)
                    })
                    removed.forEach(clientID => {
                        connControlledIDs.delete(clientID)
                    })
                }
            }
            // broadcast awareness update
            const encoder = encoding.createEncoder()
            encoding.writeVarUint(encoder, messageAwareness)
            encoding.writeVarUint8Array(encoder, awarenessProtocol.encodeAwarenessUpdate(this.awareness, changedClients))
            const buff = encoding.toUint8Array(encoder)
            this.conns.forEach((_, c) => {
                send(this, c, buff)
            })
        }
        this.awareness.on('update', awarenessChangeHandler)
        this.on('update', updateHandler)
    }
}

/**
 * Gets a Y.Doc by name, whether in memory or on disk
 *
 * @param {string} docName - the name of the Y.Doc to find or create
 * @param {boolean} gc - whether to allow gc on the doc (applies only when created)
 * @return {WSSharedDoc}
 */
export const getYDoc = (docName: string, gc = true) =>
    map.setIfUndefined(docs, docName, () => {
        const doc = new WSSharedDoc(docName)
        doc.gc = gc
        if (persistence !== null) {
            persistence.bindState(docName, doc)
        }
        docs.set(docName, doc)
        return doc
    })

const messageListener = (conn: any, doc: IWSSharedDoc, message: Uint8Array, readOnly: boolean = false) => {
    try {
        const encoder = encoding.createEncoder()
        const decoder = decoding.createDecoder(message)
        const messageType = decoding.readVarUint(decoder)
        switch (messageType) {
            case messageSync: {
                if (readOnly) {
                    const syncType = decoding.readVarUint(decoder)
                    if (syncType === syncMessageType.update) {
                        break
                    }
                    const innerDecoder = decoding.createDecoder(message)
                    encoding.writeVarUint(encoder, messageSync)
                    decoding.readVarUint(innerDecoder)
                    syncProtocol.readSyncMessage(innerDecoder, encoder, doc, conn)
                    if (encoding.length(encoder) > 1) {
                        send(doc, conn, encoding.toUint8Array(encoder))
                    }
                    break
                }
                encoding.writeVarUint(encoder, messageSync)
                syncProtocol.readSyncMessage(decoder, encoder, doc, conn)
                if (encoding.length(encoder) > 1) {
                    send(doc, conn, encoding.toUint8Array(encoder))
                }
                break
            }
            case messageAwareness: {
                awarenessProtocol.applyAwarenessUpdate(doc.awareness, decoding.readVarUint8Array(decoder), conn)
                break
            }
        }
    } catch (err) {
        Logger.error(err)
    }
}

const closeConn = (doc: IWSSharedDoc, conn: any) => {
    if (doc.conns.has(conn)) {
        const controlledIds = doc.conns.get(conn)
        doc.conns.delete(conn)
        if (controlledIds) {
            awarenessProtocol.removeAwarenessStates(doc.awareness, Array.from(controlledIds), null)
        }
        if (doc.conns.size === 0 && persistence !== null) {
            // if persisted, we store state and destroy ydoc
            persistence.writeState(doc.name, doc).then(() => {
                doc.destroy()
            })
            docs.delete(doc.name)
        }
    }
    conn.close()
}

const send = (doc: IWSSharedDoc, conn: any, m: Uint8Array) => {
    if (conn.readyState !== wsReadyStateConnecting && conn.readyState !== wsReadyStateOpen) {
        closeConn(doc, conn)
    }
    try {
        conn.send(m, (err: any) => {
            if (err != null) closeConn(doc, conn)
        })
    } catch {
        closeConn(doc, conn)
    }
}

const pingTimeout = 30000

export const setupWSConnection = (conn: any, req: any, { docName = req.url.slice(1).split('?')[0], gc = true, readOnly = false } = {}) => {
    conn.binaryType = 'arraybuffer'
    const doc = getYDoc(docName, gc)
    doc.conns.set(conn, new Set())
    conn.on('message', (message: ArrayBuffer) => messageListener(conn, doc, new Uint8Array(message), readOnly))

    // Check if connection is still alive
    let pongReceived = true
    const pingInterval = setInterval(() => {
        if (!pongReceived) {
            if (doc.conns.has(conn)) {
                closeConn(doc, conn)
            }
            clearInterval(pingInterval)
        } else if (doc.conns.has(conn)) {
            pongReceived = false
            try {
                conn.ping()
            } catch {
                closeConn(doc, conn)
                clearInterval(pingInterval)
            }
        }
    }, pingTimeout)
    conn.on('close', () => {
        closeConn(doc, conn)
        clearInterval(pingInterval)
    })
    conn.on('pong', () => {
        pongReceived = true
    })
    // put the following in a variables in a block so the interval handlers don't keep in in
    // scope
    {
        // send sync step 1
        const encoder = encoding.createEncoder()
        encoding.writeVarUint(encoder, messageSync)
        syncProtocol.writeSyncStep1(encoder, doc)
        send(doc, conn, encoding.toUint8Array(encoder))
        const awarenessStates = doc.awareness.getStates()
        if (awarenessStates.size > 0) {
            const encoder = encoding.createEncoder()
            encoding.writeVarUint(encoder, messageAwareness)
            encoding.writeVarUint8Array(encoder, awarenessProtocol.encodeAwarenessUpdate(doc.awareness, Array.from(awarenessStates.keys())))
            send(doc, conn, encoding.toUint8Array(encoder))
        }
    }
}
