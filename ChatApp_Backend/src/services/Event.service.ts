import { EntityManager, Equal } from 'typeorm'
import { AppDataSource } from '../database/data-source'
import { Domain_Events, Event_Aggregate_Type } from '../Types/Enums'
import { DomainEvent } from '../entity/DomainEvent'
import handleTypeOrmError from '../utils/handleTypeOrmError'
import { Message } from '../entity/Message'

class EventService {
  async find(eventId: bigint, manager = AppDataSource.manager) {
    try {
      const event = await manager.findOne(DomainEvent, {
        where: {
          id: eventId,
        },
      })
      if (!event) throw new Error('Event not found')
      return event
    } catch (error) {
      handleTypeOrmError(error, 'Error finding Event')
    }
  }
  async create(
    aggregateType: Event_Aggregate_Type,
    aggregate_id: string,
    event_type: Domain_Events,
    payload: Record<string, any>,
    manager: EntityManager = AppDataSource.manager
  ) {
    try {
      const event = new DomainEvent()
      event.aggregateType = aggregateType
      event.aggregateId = aggregate_id
      event.eventType = event_type
      event.payload = payload
      return await manager.save(event)
    } catch (error) {
      handleTypeOrmError(error, 'Error creating new Event')
    }
  }

  // async createMessageEvent(
  //   message_id: string,
  //   event_type: Domain_Events,
  //   payload: Message,
  //   manager: EntityManager = AppDataSource.manager
  // ) {
  //   try {
  //     const event = new DomainEvent()
  //     event.aggregateType = Event_Aggregate_Type.MESSAGE
  //     event.aggregateId = message_id
  //     if (
  //       event_type !== Domain_Events.MESSAGE_CREATED &&
  //       event_type !== Domain_Events.MESSAGE_DELETED &&
  //       event_type !== Domain_Events.MESSAGE_UPDATED &&
  //       event_type !== Domain_Events.BULK_MESSAGE_DELETED &&
  //       event_type !== Domain_Events.MESSAGE_ACKNOWLEDGED
  //     ) throw new Error('Invalid event type for message event')
  //     event.eventType = event_type
  //     event.payload = payload
  //     return await manager.save(event)
  //   } catch (error) {
  //     handleTypeOrmError(error, 'Error creating new Message Event')
  //   }
  // }
  async publishEvent(eventId: bigint, manager = AppDataSource.manager) {
    try {
      const event = await this.find(eventId, manager)
      event.published = true
      event.publishedAt = new Date()
      const publishedEvent = await manager.save(event)
      return publishedEvent
    } catch (error) {
      handleTypeOrmError(error, 'Error publishing Event')
    }
  }

  async deleteAllMessageEvents(
    messageId: string,
    manager = AppDataSource.manager
  ) {
    try {
      const events = await manager.find(DomainEvent, {
        where: [
          { aggregateId: messageId },
          {
            payload: {
              id: Equal(messageId),
            },
          },
        ],
      })
      return await manager.remove(events)
    } catch (error) {
      handleTypeOrmError(error, 'Error deleting Message Events')
    }
  }
  async getAllUnpublishedEvents(
    limit: number = 100,
    offset: number = 0,
    manager = AppDataSource.manager
  ) {
    try {
      const unpublishedEvents = await manager.find(DomainEvent, {
        where: {
          published: false,
        },
        take: limit,
        skip: offset,
        order: {
          createdAt: 'ASC',
        },
      })
      return unpublishedEvents
    } catch (error) {
      handleTypeOrmError(error, 'Error Finding Unpublished Events')
    }
  }
  async getUnpublishedDomainEvents(
    eventType: Domain_Events,
    manager: EntityManager = AppDataSource.manager
  ) {
    try {
      const unpublishedEvents = await manager.find(DomainEvent, {
        where: {
          eventType: eventType,
          published: false,
        },
      })
      return unpublishedEvents
    } catch (error) {
      handleTypeOrmError(error, 'Error finding unpublished Events')
    }
  }

  async getEventOfMessage(messageId: string, manager = AppDataSource.manager) {
    try {
      const event = await manager.findOne(DomainEvent, {
        where: {
          aggregateId: messageId,
        },
      })
      return event
    } catch (error) {
      handleTypeOrmError(error, 'Error finding event of message')
    }
  }
}

export default new EventService()
