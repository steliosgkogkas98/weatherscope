import { TestBed } from '@angular/core/testing';

import { CacheService } from './cache.service';

describe('CacheService', () => {
  let cache: CacheService;

  beforeEach(() => {
    sessionStorage.clear();
    vi.useFakeTimers();
    TestBed.configureTestingModule({});
    cache = TestBed.inject(CacheService);
  });

  afterEach(() => vi.useRealTimers());

  it('returns stored values before they expire', () => {
    cache.set('key', { value: 42 }, 1000);
    expect(cache.get('key')).toEqual({ value: 42 });
  });

  it('drops values after the TTL', () => {
    cache.set('key', 'hello', 1000);
    vi.advanceTimersByTime(1001);
    expect(cache.get('key')).toBeUndefined();
  });

  it('survives a page refresh through sessionStorage', () => {
    cache.set('key', 'persisted', 60_000);
    const freshInstance = new CacheService();
    expect(freshInstance.get('key')).toBe('persisted');
  });
});
