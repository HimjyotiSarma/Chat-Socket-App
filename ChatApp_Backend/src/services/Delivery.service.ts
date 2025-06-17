import { EntityManager, IsNull, Not } from 'typeorm'
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

  async findByEventAndUser(eventId: bigint, userId: string) {
    try {
      const delivery = await AppDataSource.manager.findOne(DeliveryStatus, {
        where: {
          domainEvent: {
            id: eventId,
          },
          user: {
            id: userId,
          },
        },
        relations: ['domainEvent', 'user'],
      })
      if (!delivery) {
        throw new Error(
          'Delivery Status not found for the given event and user'
        )
      }
      return delivery
    } catch (error) {
      handleTypeOrmError(
        error,
        'Error finding Delivery Status by event and user'
      )
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

  async getDeliveredButUnacknowledged(
    eventId: bigint,
    manager: EntityManager = AppDataSource.manager
  ) {
    try {
      const pendingDeliveries = await manager.find(DeliveryStatus, {
        where: {
          domainEvent: {
            id: eventId,
          },
          deliveredAt: Not(IsNull()),
          ackAt: IsNull(),
        },
      })
      return pendingDeliveries
    } catch (error) {
      handleTypeOrmError(error, 'Error finding pending deliveries')
    }
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
  async getUnsentEventDeliveries(
    eventId: bigint,
    manager: EntityManager = AppDataSource.manager
  ) {
    try {
      const undeliveredEvents = await manager.find(DeliveryStatus, {
        where: {
          deliveredAt: IsNull(),
          domainEvent: {
            id: eventId,
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

  async getUnacknowlegedDeliveriesforUser(
    user: User,
    manager: EntityManager = AppDataSource.manager
  ) {
    try {
      const unacknowledgedDeliveries = await manager.find(DeliveryStatus, {
        where: {
          user: user,
          deliveredAt: Not(IsNull()),
          ackAt: IsNull(),
        },
      })
      return unacknowledgedDeliveries
    } catch (error) {
      handleTypeOrmError(error, 'Error finding unacknowledged deliveries')
    }
  }

  async getUnacknowledgedEventDeliveries(
    domainEventId: bigint,
    manager: EntityManager = AppDataSource.manager
  ) {
    try {
      const unacknowledgedEventDeliveries = await manager.find(DeliveryStatus, {
        where: {
          domainEvent: {
            id: domainEventId,
          },
          deliveredAt: Not(IsNull()),
          ackAt: IsNull(),
        },
        relations: ['domainEvent', 'user'],
      })
      return unacknowledgedEventDeliveries
    } catch (error) {
      handleTypeOrmError(error, 'Error finding unacknowledged event deliveries')
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
    deliveredAt: Date = new Date(),
    manager: EntityManager = AppDataSource.manager
  ) {
    try {
      const delivery = await this.find(deliveryId, manager)
      delivery.deliveredAt = deliveredAt
      delivery.deliveryAttempts += 1
      delivery.lastAttemptedAt = new Date()
      delivery.ackAt = null // Reset ackAt when marking as delivered
      return await manager.save(delivery)
    } catch (error) {
      handleTypeOrmError(error, 'Error marking delivery status as delivered')
    }
  }

  async markAllDelivered(
    domainEvent: DomainEvent,
    manager: EntityManager = AppDataSource.manager
  ) {
    try {
      const deliveries = await manager.find(DeliveryStatus, {
        where: {
          domainEvent: domainEvent,
          deliveredAt: IsNull(),
          ackAt: IsNull(),
        },
      })
      deliveries.forEach((delivery) => {
        delivery.deliveredAt = new Date()
      })
      return await manager.save(deliveries)
    } catch (error) {
      handleTypeOrmError(error, 'Error marking all deliveries as delivered')
    }
  }

  async acknowledge(
    domainEvent: DomainEvent,
    user_id: string,
    manager: EntityManager = AppDataSource.manager
  ) {
    try {
      const delivery = await manager.findOne(DeliveryStatus, {
        where: {
          domainEvent: domainEvent,
          user: {
            id: user_id,
          },
          ackAt: IsNull(),
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

  async acknowledgeById(
    delivery: DeliveryStatus,
    manager: EntityManager = AppDataSource.manager
  ) {
    try {
      if (delivery.ackAt) {
        throw new Error('Delivery already acknowledged')
      }
      delivery.ackAt = new Date()
      return await manager.save(delivery)
    } catch (error) {
      handleTypeOrmError(error, 'Error acknowledging delivery from User')
    }
  }
}
export default new DeliveryService()
