/**
 * Spark requests from anything in the scene. Emitters push, the single `CursorSparks`
 * component in the canvas drains the queue once per frame.
 */
export type SparkEvent = { x: number; y: number; z: number; color: string }

const queue: SparkEvent[] = []
const MAX_QUEUED = 24

export const sparks = {
  emit(x: number, y: number, z: number, color: string) {
    if (queue.length < MAX_QUEUED) queue.push({ x, y, z, color })
  },
  drain(): SparkEvent[] {
    return queue.length ? queue.splice(0, queue.length) : []
  },
}
