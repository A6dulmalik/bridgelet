import { apiClient, ApiRequestError } from '../apiClient';
import { secureStorage } from '../storage';

// Mock secureStorage
jest.mock('../storage', () => ({
  secureStorage: {
    getItem: jest.fn(),
  },
}));

// Mock fetch
global.fetch = jest.fn();

describe('apiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it('should inject auth token into headers', async () => {
    (secureStorage.getItem as jest.Mock).mockResolvedValue('test-token');
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: { success: true } }),
    });

    await apiClient('/test');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/test'),
      expect.objectContaining({
        headers: expect.any(Headers),
      })
    );

    const callHeaders = (global.fetch as jest.Mock).mock.calls[0][1].headers;
    expect(callHeaders.get('Authorization')).toBe('Bearer test-token');
  });

  it('should retry on 500 errors', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: { message: 'Server error' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: { success: true } }),
      });

    const result = await apiClient('/retry-test');

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ success: true });
  });

  it('should throw ApiRequestError on 400 errors without retrying', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: { message: 'Bad request' } }),
    });

    await expect(apiClient('/bad-request')).rejects.toThrow(ApiRequestError);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should handle wrapped response data', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: { foo: 'bar' } }),
    });

    const result = await apiClient('/wrapped');
    expect(result).toEqual({ foo: 'bar' });
  });

  it('should handle unwrapped response data', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ baz: 'qux' }),
    });

    const result = await apiClient('/unwrapped');
    expect(result).toEqual({ baz: 'qux' });
  });
});
