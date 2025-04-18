import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';

@Catch()
export class TasksFilter<T> implements ExceptionFilter {
  catch(exception: T, host: ArgumentsHost) {}
}
