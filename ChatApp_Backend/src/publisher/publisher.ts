import amqp from 'amqplib'

async function publishEvent(
  exchange: string,
  routingKey: string,
  payload: Buffer
): Promise<void> {
  try {
    const connection = await amqp.connect(
      process.env.RABBITMQ_URL || 'amqp://localhost'
    )
    const channel = await connection.createChannel()
    await channel.assertExchange(exchange, 'topic', { durable: true })
    const result = channel.publish(exchange, routingKey, payload)
    console.log(
      `Event published to exchange: ${exchange}, routingKey: ${routingKey}, result: ${result}`
    )
    await channel.close()
    await connection.close()
  } catch (error) {
    console.error('Error publishing event:', error)
    throw error
  }
}
export default publishEvent
