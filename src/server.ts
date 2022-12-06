import express from 'express'
import cors, { CorsOptions } from 'cors'
import { getConnection } from './infra/database'
import { jwtCheck } from './middlewares/jwt-check'
import authRouter from './auth'
import userRouter from 'users'
import postRouter from 'posts'
import voteRouter from './votes'
import imagesRouter from 'post-images'

const PORT = parseInt(process.env.PORT!, 10)
const corsOption: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true)
    }

    // const host = origin.split('://')[1]
    // const allowedHost = ['localhost:3000']
    // const allowed = allowedHost.includes(host)
    callback(null, true)
  },
  credentials: true,
}

export default class Server {
  public app: express.Application

  constructor() {
    getConnection()
    this.app = express()
    this.setup()
  }

  private setup(): void {
    this.app.use(cors(corsOption))
    this.app.use(express.json())
    this.app.use(express.urlencoded({ extended: true }))
    this.app.get('/', (request, response) => {
      return response.status(200).send('code has changed!')
    })
    this.app.use('/v1/auth', authRouter)
    this.app.use('/v1/votes', jwtCheck, voteRouter)
    this.app.use('/v1/users', jwtCheck, userRouter)
    this.app.use('/v1/post-images', jwtCheck, imagesRouter)
    this.app.use('/v1/posts', postRouter)
  }

  public start(): void {
    this.app.listen(PORT || 3000, () => {
      console.log(`Server Listening on port ${PORT}`)
      console.log(`
      JWT_SECRET: ${process.env.JWT_SECRET},
      DB_USER: ${process.env.DB_USER},
      DB_PASS: ${process.env.DB_PASS},
      ACCESS_KEY_ID: ${process.env.ACCESS_KEY_ID},
      SECRET_ACCESS_KEY: ${process.env.SECRET_ACCESS_KEY}
      `)
    })
    return
  }
}
