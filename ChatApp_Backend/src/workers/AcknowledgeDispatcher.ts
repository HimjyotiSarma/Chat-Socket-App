import amqp from 'amqplib'
import { EventInfoDTO } from '../Types/DataTransferObjects/EventsDTO'
import { MessageInfoDTO } from '../Types/DataTransferObjects/MessageDTO'
import UserService from '../services/User.service'
import DeliveryService from '../services/Delivery.service'
import EventService from '../services/Event.service'

async function start() {
  const connection = await amqp.connect(
    process.env.RABBITMQ_URL || 'amqp://localhost'
  )
  const channel = await connection.createChannel()
  const queue = 'message_ack_dispatcher'
  await channel.assertQueue(queue)
  await channel.bindQueue(queue, 'event_hub', '*acknowledged*')
  channel.consume(queue, async (msg) => {
    try {
      if (!msg) return
      const payload: { event: EventInfoDTO<any>; userId: string } = JSON.parse(
        msg.content.toString()
      )
      if (!payload || !payload.event) return
      const user = await UserService.find(payload.userId)
      if (!user) return
      const domainEvent = await EventService.find(payload.event.id)
      if (!domainEvent) {
        console.error(`Event with ID ${payload.event.id} not found`)
        return
      }
      const deliveryStatus = await DeliveryService.findByEventAndUser(
        domainEvent.id,
        user.id
      )
      if (!deliveryStatus) {
        console.error(
          `No delivery found for event ${payload.event.id} and user ${user.id}`
        )
        return
      }

      const acknowledgedDelivery = await DeliveryService.acknowledgeById(
        deliveryStatus
      )
      if (!acknowledgedDelivery) {
        console.error(
          `Failed to acknowledge delivery for event ${payload.event.id} and user ${user.id}`
        )
      }
    } catch (error) {
      console.error('Error processing message acknowledgment:', error)
    }
  })
}

start().catch((err) => {
  console.error('Error starting message ack dispatcher:', err)
})
