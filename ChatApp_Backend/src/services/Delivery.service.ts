import { EntityManager, IsNull } from 'typeorm'
import { User } from '../entity/User'
import { AppDataSource } from '../database/data-source'
import handleTypeOrmError from '../utils/handleTypeOrmError'
import { DeliveryStatus } from '../entity/DeliveryStatus'
import EventService from './Event.service'
import { Domain_Events } from '../Types/Enums'
import { DomainEvent } from '../entity/DomainEvent'

class DeliveryService {
  async find(
    deliveryId: bigint,
    manager: EntityManager = AppDataSource.manager
  ) {
    try {
      const delivery = await manager.findOne(DeliveryStatus, {
        where: {
          id: deliveryId,
        },
      })
      if (!delivery) {
        throw new Error('Delivery Status not found')
      }
      return delivery
    } catch (error) {
      handleTypeOrmError(error, 'Error finding Delivery Status')
    }
  }

  async initDelivery(
    eventId: bigint,
    users: User[],
    manager: EntityManager = AppDataSource.manager
  ) {
    return await manager
      .transaction(async (transactionalManager) => {
        const event = await EventService.find(eventId, transactionalManager)
        const deliveryStatuses = users.map((user) => {
          const delivery = new DeliveryStatus()
          delivery.domainEvent = event
          delivery.user = user
          return delivery
        })
        const savedDeliveryStatuses = await transactionalManager.save(
          deliveryStatuses
        )
        return savedDeliveryStatuses
      })
      .catch((error) => {
        handleTypeOrmError(error, 'Error initializing Delivery')
      })
  }

  async getUndeliveredForUser(
    user: User,
    manager: EntityManager = AppDataSource.manager
  ) {
    try {
      const pendingDeliveries = await manager.find(DeliveryStatus, {
        where: {
          user: user,
          deliveredAt: IsNull(),
        },
      })
      return pendingDeliveries
    } catch (error) {
      handleTypeOrmError(
        error,
        'Error finding undelivered delivery status for user'
      )
    }
  }
  async getEventPendingDeliveries(
    eventName: Domain_Events,
    manager: EntityManager = AppDataSource.manager
  ) {
    try {
      const undeliveredEvents = await manager.find(DeliveryStatus, {
        where: {
          deliveredAt: IsNull(),
          domainEvent: {
            eventType: eventName,
          },
        },
        relations: ['domainEvent', 'user'],
        order: {
          createdAt: 'ASC',
        },
      })
      return undeliveredEvents
    } catch (error) {
      handleTypeOrmError(error, 'Error finding pending deliveries')
    }
  }

  async getAllPendingDeliveries(
    limit: number = 100,
    offset: number = 0,
    manager: EntityManager = AppDataSource.manager
  ) {
    try {
      const pendingDeliveries = await manager.find(DeliveryStatus, {
        where: {
          deliveredAt: IsNull(),
        },
        take: limit,
        skip: offset,
        order: {
          createdAt: 'ASC',
        },
      })

      return pendingDeliveries
    } catch (error) {
      handleTypeOrmError(error, 'Error finding pending deliveries')
    }
  }

  async incrementAttempts(
    domainEvent: DomainEvent,
    user: User,
    manager: EntityManager = AppDataSource.manager
  ) {
    try {
      const delivery = await manager.findOne(DeliveryStatus, {
        where: {
          domainEvent: domainEvent,
          user: user,
        },
      })
      if (!delivery) {
        throw new Error('Delivery Status not found')
      }
      delivery.deliveryAttempts += 1
      delivery.lastAttemptedAt = new Date()
      return await manager.save(delivery)
    } catch (error) {
      handleTypeOrmError(error, 'Error incrementing delivery attempts')
    }
  }

  async markDelivered(
    deliveryId: bigint,
    manager: EntityManager = AppDataSource.manager
  ) {
    try {
      const delivery = await this.find(deliveryId, manager)
      delivery.deliveredAt = new Date()
      return await manager.save(delivery)
    } catch (error) {
      handleTypeOrmError(error, 'Error marking delivery status as delivered')
    }
  }

  async acknowledge(
    domainEvent: DomainEvent,
    user: User,
    manager: EntityManager = AppDataSource.manager
  ) {
    try {
      const delivery = await manager.findOne(DeliveryStatus, {
        where: {
          domainEvent: domainEvent,
          user: user,
        },
      })
      if (!delivery) {
        throw new Error('Delivery Status not found')
      }
      delivery.ackAt = new Date()
      return await manager.save(delivery)
    } catch (error) {
      handleTypeOrmError(error, 'Error acknowledging delivery from User')
    }
  }
}
export default new DeliveryService()
