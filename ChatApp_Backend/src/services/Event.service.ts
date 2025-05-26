import { EntityManager } from 'typeorm'
import { AppDataSource } from '../database/data-source'
import { Domain_Events, Event_Aggregate_Type } from '../Types/Enums'
import { DomainEvent } from '../entity/DomainEvent'
import handleTypeOrmError from '../utils/handleTypeOrmError'

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
      await manager.save(DomainEvent)
    } catch (error) {
      handleTypeOrmError(error, 'Error creating new Event')
    }
  }
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
}

export default new EventService()
