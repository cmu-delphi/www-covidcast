/// <reference types="jest" />
import { getLevelInfo } from './constants';

describe('getLevelInfo', () => {
  test('existing', () => {
    expect(getLevelInfo('county').id).toBe('county');
    expect(getLevelInfo('county').label).toBe('County');
  });
  test('invalid', () => {
    expect(getLevelInfo('test').id).toBe('test');
    expect(getLevelInfo('test').label).toBe('Test');
  });
});
