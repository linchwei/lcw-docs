/**
 * 事件发射器模块
 * 提供基于发布-订阅模式的事件管理功能，支持事件的注册、触发和移除
 */

/**
 * 从对象类型 T 中提取字符串类型的键
 */
type StringKeyOf<T> = Extract<keyof T, string>
/**
 * 根据事件名称获取回调参数类型
 * 如果事件参数是数组类型则直接返回，否则包装为数组
 */
type CallbackType<T extends Record<string, any>, EventName extends StringKeyOf<T>> = T[EventName] extends any[]
    ? T[EventName]
    : [T[EventName]]
/**
 * 回调函数类型定义
 */
type CallbackFunction<T extends Record<string, any>, EventName extends StringKeyOf<T>> = (...props: CallbackType<T, EventName>) => any

/**
 * 事件发射器类
 * 通用的事件管理类，支持订阅、发布和取消订阅事件
 * @typeParam T - 事件映射类型，键为事件名称，值为回调函数参数类型
 */
export class EventEmitter<T extends Record<string, any>> {
    // 存储所有事件回调函数的对象，键为事件名，值为回调函数数组
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    private callbacks: { [key: string]: Function[] } = {}

    /**
     * 订阅指定事件
     * @param event - 事件名称
     * @param fn - 事件触发时执行的回调函数
     * @returns 取消订阅的函数，调用后可移除该回调
     */
    public on<EventName extends StringKeyOf<T>>(event: EventName, fn: CallbackFunction<T, EventName>) {
        if (!this.callbacks[event]) {
            this.callbacks[event] = []
        }

        this.callbacks[event].push(fn)

        return () => this.off(event, fn)
    }

    /**
     * 触发指定事件
     * @param event - 事件名称
     * @param args - 传递给回调函数的参数
     */
    protected emit<EventName extends StringKeyOf<T>>(event: EventName, ...args: CallbackType<T, EventName>) {
        const callbacks = this.callbacks[event]

        if (callbacks) {
            callbacks.forEach(callback => callback.apply(this, args))
        }
    }

    /**
     * 取消订阅指定事件
     * @param event - 事件名称
     * @param fn - 要移除的回调函数，如果不提供则移除该事件的所有回调
     */
    public off<EventName extends StringKeyOf<T>>(event: EventName, fn?: CallbackFunction<T, EventName>) {
        const callbacks = this.callbacks[event]

        if (callbacks) {
            if (fn) {
                this.callbacks[event] = callbacks.filter(callback => callback !== fn)
            } else {
                delete this.callbacks[event]
            }
        }
    }

    /**
     * 移除所有事件监听器
     * 清空所有已注册的事件回调
     */
    protected removeAllListeners(): void {
        this.callbacks = {}
    }
}