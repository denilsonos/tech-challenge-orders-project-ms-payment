import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { OrmAdapter } from '../../adapters/gateways/orm-adapter'
import { PaymentDAO } from '../../base/dao/payment'


const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME_PAYMENTS, DB_PORT } = process.env

export class MysqlOrmAdapter implements OrmAdapter {
  private static instance: MysqlOrmAdapter | undefined // eslint-disable-line no-use-before-define
  public database!: DataSource

  public static getInstance(): MysqlOrmAdapter {
    if (!MysqlOrmAdapter.instance) {
      MysqlOrmAdapter.instance = new MysqlOrmAdapter()
    }

    return MysqlOrmAdapter.instance
  }

  public async init(): Promise<void> {
    this.database = this.databaseConnection()

    if (this.database.isInitialized) {
      console.log('Database already connected')
    }
    await this.database
      .initialize()
      .then(() => {
        console.log('🚀 Connected to the database')
      })
      .catch((error) => {
        console.error('Error initialize to the database:', error)
        throw error
      })
  }

  private databaseConnection() {
    return new DataSource({
      type: 'mysql',
      host: DB_HOST,
      port: Number(DB_PORT),
      username: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME_PAYMENTS,
      synchronize: true,
      logging: false,
      entities: [
        PaymentDAO,
      ],
      migrations: [],
      subscribers: [],
    })
  }
}
