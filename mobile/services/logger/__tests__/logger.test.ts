import { logger } from '../index';

describe('Logger Module', () => {
  beforeEach(() => {
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('logs info messages correctly', () => {
    const infoSpy = jest.spyOn(console, 'info');
    logger.info('TEST_TAG', 'Test info message');
    expect(infoSpy).toHaveBeenCalledWith(
      expect.stringContaining('[INFO][TEST_TAG] Test info message')
    );
  });

  it('logs warn messages correctly', () => {
    const warnSpy = jest.spyOn(console, 'warn');
    logger.warn('TEST_TAG', 'Test warning message');
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[WARN][TEST_TAG] Test warning message')
    );
  });

  it('logs error messages correctly', () => {
    const errorSpy = jest.spyOn(console, 'error');
    logger.error('TEST_TAG', 'Test error message');
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[ERROR][TEST_TAG] Test error message')
    );
  });
});
