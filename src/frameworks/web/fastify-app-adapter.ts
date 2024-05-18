import 'dotenv/config'
import fastify, { FastifyInstance } from 'fastify'
import multipart from '@fastify/multipart'
import cors from '@fastify/cors'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import { AppAdapter } from '../../adapters/gateways/app-adapter'
import { swaggerOptions, swaggerUiOptions } from './swagger/swagger'
import { confirmOrderPaymentRoute } from './routes/payments/confirm-order-payment-route'
import { createOrderPaymentRoute } from './routes/payments/create-order-payment-route'
import { getOrderPaymentRoute } from './routes/payments/get-order-payment-route'
import { healthCheckRoute } from './routes/health-check/health-check-router'
import { recuseOrderPaymentRoute } from './routes/payments/recuse-order-payment-route'

export class FastifyAppAdapter implements AppAdapter {
  private readonly app: FastifyInstance
  private readonly port = Number(process.env.APP_PORT)
  private readonly host = process.env.APP_HOST

  constructor() {
    this.app = fastify({
      logger: true,
      requestTimeout: 30000,
    })
  }

  public async init(): Promise<void> {
    this.app.register(multipart)
    this.app.register(cors, {
      origin: [`*`],
    })

    this.app.register(fastifySwagger, swaggerOptions);
    this.app.register(fastifySwaggerUi, swaggerUiOptions);
    
    // Routes
    this.app.register(createOrderPaymentRoute, { prefix: '/api/v1' }) // http://localhost:3000/api/v1/orders/payments
    this.app.register(getOrderPaymentRoute, { prefix: '/api/v1' }) // http://localhost:3000/api/v1/orders/payments/:id
    this.app.register(confirmOrderPaymentRoute, { prefix: '/api/v1' }) // http://localhost:3000/api/v1/orders/payments/confirm
    this.app.register(recuseOrderPaymentRoute, { prefix: '/api/v1' }) // http://localhost:3000/api/v1/orders/payments/recuse

    // Health Check Route
    this.app.register(healthCheckRoute, { prefix: '/api/v1'}) // http://localhost:3000/api/v1/health-check
    
    await this.app
      .listen({ host: this.host, port: this.port })
      .then(() => {
        console.log(`🚀 HTTP server running on http://localhost:${this.port}`)
      })
      .catch((error) => {
        console.error('Error starting the server:', error)
        throw error
      })
  }
}
