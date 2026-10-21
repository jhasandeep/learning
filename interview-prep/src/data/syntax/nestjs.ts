import type { SyntaxSet } from './types'

export const nestjs: SyntaxSet = {
  id: 'nestjs',
  title: 'NestJS',
  snippets: [
    {
      id: 'feature-module',
      title: 'Feature module',
      lang: 'typescript',
      code: `import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UsersController } from './users.controller'
import { UsersService } from './users.service'
import { User } from './user.entity'

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}`,
      note: 'A **module** groups controllers and providers. Only what is in `exports` can be injected by modules that import this one.',
    },
    {
      id: 'controller',
      title: 'Controller with route decorators',
      lang: 'typescript',
      code: `@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  @Get()
  findAll(@Query('role') role?: string) {
    return this.usersService.findAll(role)
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id)
  }

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto)
  }
}`,
      note: 'Decorators map HTTP to methods: `@Param` for the path, `@Query` for the query string, `@Body` for the payload. `@Post` returns **201** by default.',
    },
    {
      id: 'service-di',
      title: 'Service with constructor DI',
      lang: 'typescript',
      code: `@Injectable()
export class OrdersService {
  constructor(
    private readonly users: UsersService,
    private readonly mail: MailService,
  ) {}

  async place(userId: number, dto: CreateOrderDto) {
    const user = await this.users.findOne(userId)
    const order = { id: Date.now(), userId: user.id, ...dto }
    await this.mail.sendReceipt(user.email, order)
    return order
  }
}`,
      note: '`@Injectable` plus a typed constructor is all Nest needs: the **IoC container** resolves each dependency by its class and passes a singleton in.',
    },
    {
      id: 'dto-validation',
      title: 'DTO with class-validator',
      lang: 'typescript',
      code: `export class CreateUserDto {
  @IsString()
  @Length(2, 50)
  name: string

  @IsEmail()
  email: string

  @IsOptional()
  @IsInt()
  @Min(18)
  age?: number
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}`,
      note: 'A **DTO** is a class (not an interface) so the decorators exist at runtime for `ValidationPipe`. `PartialType` makes every field optional for updates.',
    },
    {
      id: 'bootstrap',
      title: 'main.ts bootstrap',
      lang: 'typescript',
      code: `import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.setGlobalPrefix('api')
  app.enableCors({ origin: process.env.CLIENT_URL })
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  await app.listen(process.env.PORT ?? 3000)
}
bootstrap()`,
      note: 'The entry point. A global `ValidationPipe` validates every DTO; **whitelist** strips unknown fields and `transform` turns payloads into DTO instances.',
    },
    {
      id: 'repository-injection',
      title: 'Repository injection',
      lang: 'typescript',
      code: `@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  findAll() {
    return this.repo.find({ order: { id: 'ASC' } })
  }

  async findOne(id: number) {
    const user = await this.repo.findOneBy({ id })
    if (!user) throw new NotFoundException(\`User \${id} not found\`)
    return user
  }
}`,
      note: '`@InjectRepository` gives the TypeORM repository registered by `forFeature`. Throwing a built-in **HttpException** like `NotFoundException` becomes a 404 response.',
    },
    {
      id: 'exception-filter',
      title: 'Custom exception and filter',
      lang: 'typescript',
      code: `export class InsufficientFundsException extends HttpException {
  constructor(balance: number) {
    super({ message: 'Insufficient funds', balance }, 422)
  }
}

@Catch(HttpException)
export class HttpErrorFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const res = ctx.getResponse<Response>()
    res.status(exception.getStatus()).json({
      error: exception.getResponse(),
      path: ctx.getRequest<Request>().url,
      timestamp: new Date().toISOString(),
    })
  }
}`,
      note: 'Extend `HttpException` for domain errors, and an **exception filter** shapes every error response the same way. Register it with `app.useGlobalFilters`.',
    },
    {
      id: 'custom-pipe',
      title: 'Custom pipe',
      lang: 'typescript',
      code: `@Injectable()
export class ParsePositiveIntPipe implements PipeTransform {
  transform(value: string, metadata: ArgumentMetadata): number {
    const n = Number(value)
    if (!Number.isInteger(n) || n <= 0) {
      throw new BadRequestException(
        \`\${metadata.data} must be a positive integer\`,
      )
    }
    return n
  }
}

// usage: @Param('id', ParsePositiveIntPipe) id: number`,
      note: 'A **pipe** transforms or validates one argument before the handler runs. Built-ins like `ParseIntPipe` cover most cases; write one for custom rules.',
    },
    {
      id: 'roles-guard',
      title: 'Roles guard',
      lang: 'typescript',
      code: `export const ROLES_KEY = 'roles'
export const Roles = (...roles: string[]) =>
  SetMetadata(ROLES_KEY, roles)

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    )
    if (!roles) return true
    const { user } = context.switchToHttp().getRequest()
    return roles.some((role) => user?.roles?.includes(role))
  }
}`,
      note: 'A **guard** answers "may this request run?" by returning true or false (false is a 403). Use with `@Roles(\'admin\')` and `@UseGuards(JwtAuthGuard, RolesGuard)`.',
    },
    {
      id: 'logging-interceptor',
      title: 'Logging interceptor',
      lang: 'typescript',
      code: `@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP')

  intercept(context: ExecutionContext, next: CallHandler) {
    const req = context.switchToHttp().getRequest()
    const start = Date.now()
    return next.handle().pipe(
      tap(() => {
        const ms = Date.now() - start
        this.logger.log(\`\${req.method} \${req.url} \${ms}ms\`)
      }),
    )
  }
}`,
      note: 'An **interceptor** wraps the handler: code before `next.handle()` runs first, and RxJS operators on the returned Observable run after. Good for timing, caching and mapping responses.',
    },
    {
      id: 'middleware-class',
      title: 'Middleware class',
      lang: 'typescript',
      code: `@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const id = req.header('x-request-id') ?? randomUUID()
    res.setHeader('x-request-id', id)
    next()
  }
}

@Module({ imports: [UsersModule] })
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes(UsersController)
  }
}`,
      note: 'Nest middleware is Express middleware with DI, applied in a module\'s `configure`. It runs **before guards**, interceptors and pipes.',
    },
    {
      id: 'config-service',
      title: 'Config with ConfigService',
      lang: 'typescript',
      code: `@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.getOrThrow<string>('DATABASE_URL'),
        autoLoadEntities: true,
      }),
    }),
    UsersModule,
  ],
})
export class AppModule {}`,
      note: '`ConfigModule` loads `.env`; inject `ConfigService` anywhere, or into an **async factory** like this one so the database reads config at startup.',
    },
  ],
}
