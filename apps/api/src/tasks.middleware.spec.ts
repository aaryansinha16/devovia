import { TasksMiddleware } from './tasks.middleware';

describe('TasksMiddleware', () => {
  it('should be defined', () => {
    expect(new TasksMiddleware()).toBeDefined();
  });
});
